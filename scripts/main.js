"use strict";

/* --------描画の管理クラス-------- */
class DrawManager {
    canvas;
    context;
    before = { target: undefined, strings: [] };

    constructor ( canvasId ) {
        // キャンバスとコンテキストの取得
        this.canvas = document.getElementById( canvasId );
        if ( !this.canvas || !this.canvas.getContext ) {
            console.error( "canvas is undefined" );
            return;
        }
        this.context = this.canvas.getContext( "2d" );
        if ( !this.context ) {
            console.error( "context is undefined" );
            return;
        }
    }
    /*
        対象データを描画する
    */
    drawData ( target ) {
        // 背景を塗りつぶす
        this.context.fillStyle = "#336666";
        this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );
        // データをヒストグラムとして描画する
        if ( target ) {
            this.before.target = target;
            const data = target.data;
            const coloringIndices = target.coloringIndices;
            // ヒストグラムの幅と高さを調整
            const dw = this.canvas.width / data.length;
            const dh = this.canvas.height / ( data.length + 1 );
            const margin = dw * 0.1;
            // ヒストグラムのカラーを調整
            const max = data.reduce( ( a,b ) => a > b ? a : b );
            const base = 51;
            const gradient = ( 256 - base ) / max;
            // ヒストグラムを描画する
            data.forEach( ( e, i ) => {
                this.context.fillStyle = `rgb(${gradient * e + base}, ${gradient * e + base}, ${gradient * e + base})`;
                if ( coloringIndices ) {
                    if ( i === coloringIndices[0] ) this.context.fillStyle = "#993333";
                    if ( i === coloringIndices[1] ) this.context.fillStyle = "#339933";
                    if ( i === coloringIndices[2] ) this.context.fillStyle = "#333399";
                }
                this.context.fillRect( i * dw + margin, this.canvas.height - ( e * dh ), dw - margin, e * dh );
            } );
        }
    }
    /*
        テキストを描画する
    */
    drawString ( ...args ) {
        this.before.strings = args;
        this.context.font = "14px serif";
        this.context.fillStyle = "#ffffff";
        args.forEach( ( value ) => {
            this.context.fillText( value.str, 10, 15 * value.line );
        } );
    }
    /*
        前回データのまま再描画する
    */
    redraw ( ) {
        this.drawData ( this.before.target );
        this.drawString( ...this.before.strings );
    }
}

/* --------メイン処理-------- */
function main () {
    // 描画データの準備
    const NUM = 128;
    const data = Array( NUM ).fill().map( ( _, i ) => i + 1 );
    const seed = performance.now();
    const shuffledData1 = FisherYatesShuffle.shuffle( data.slice( 0, NUM / 4 ), seed );
    const shuffledData2 = FisherYatesShuffle.shuffle( data, seed );
    /*
        アルゴリズムの可視化
        対象のアルゴリズムを順番に描画する
    */
    const ALGORITHMS = [
        new BubbleSort( shuffledData1 ),
        new SelectionSort( shuffledData1 ),
        new InsertionSort( shuffledData1 ),
        new QuickSort( shuffledData2 ),
        new MergeSort( shuffledData2 ),
        // おまけ
        new FisherYatesShuffle( data, seed )
    ].values();
    let algorithm = ALGORITHMS.next().value;
    let iterator = algorithm.generator();

    // 描画ループ
    // キャンバスとコンテキストを取得
    const drawManager = new DrawManager( "canvas" );
    // 時間計測の準備
    const timer = new Timer();
    // 描画ハンドリング用の設定値
    const handler = {
        id : undefined,
        start : performance.now(),
        interval : 1000 / 30,
        done : false,
    };
    function loop ( timestamp ) {
        // 描画タイミングを調整
        if ( handler.interval > timestamp - handler.start ) {
            handler.id = window.requestAnimationFrame( loop );
            return;
        } else {
            handler.start = timestamp;
        }
        // イテレータを進める（処理時間計測のため、タイマーのポーズを解除）
        timer.resume();
        const result = iterator.next();
        // イテレータの結果をチェック
        if ( result.done ) {
            // イテレータが完了した場合
            // タイマーをストップし、最終状態の描画とアニメーションキャンセル
            const time = Math.round( timer.stop() * 100 ) / 100;
            drawManager.drawData( result.value );
            handler.id = window.cancelAnimationFrame( handler.id );
            // 結果を表示する
            drawManager.drawString( {
                str: `Algorithm: ${algorithm.constructor.name}` +
                    `, count: ${result.value.loops}` +
                    `, swap: ${result.value.swaps}` +
                    `, time: ${time} [ms]`,
                line: 1
            } );
            // 次のアルゴリズムを取り出す
            algorithm = ALGORITHMS.next().value;
            if ( algorithm ) {
                // 次のアルゴリズムからイテレータを取得
                iterator = algorithm.generator();
                timer.reset();
                drawManager.drawString( { str: `Click to Next! (${algorithm.constructor.name})`, line: 2 } );
            } else {
                // 次のアルゴリズムがない場合は終了状態とする
                handler.done = true;
                drawManager.drawString( { str:  "The end. Thank you for using.", line: 2 } );
            }
        } else {
            // イテレータが続く場合
            // 処理時間計測のため、タイマーは次のイテレータ直前までポーズ
            timer.pause();
            // 描画して次のループへ
            drawManager.drawData( result.value );
            drawManager.drawString( { str: `Algorithm: ${algorithm.constructor.name}`, line: 1 } );
            handler.id = window.requestAnimationFrame( loop );
        }
    }

    // イベントハンドラの設定
    window.addEventListener( "click", ( /* event */ ) => {
        // 終了状態のときは何もしない
        if ( handler.done ) return;
        // クリックごとにアニメーションを再開／一時停止する
        if ( !handler.id ) {
            handler.id = window.requestAnimationFrame( loop );
        } else {
            handler.id = window.cancelAnimationFrame( handler.id );
        }
    } );
    // 画面のリサイズが発生したら、<canvas> 要素のサイズを調整する
    window.addEventListener( "resize", ( /* event */ ) => {
        document.getElementById( "canvas" )
            .setAttribute( "width", document.getElementById( "wrapper" ).clientWidth );
        document.getElementById( "canvas" )
            .setAttribute( "height", document.getElementById( "wrapper" ).clientHeight );
        drawManager.redraw( );
    } );
    window.dispatchEvent( new Event( "resize" ) );

    // 準備完了後のインフォメーション
    drawManager.drawData(  );
    drawManager.drawString(
        { str: "Visualize Sorting Algorithms.", line: 1 },
        { str: `Click to Next! (${algorithm.constructor.name})`, line: 2 }
    );
    timer.reset();
    console.info ( "ready." );
}

// DOMContentLoaded 契機で、メイン処理を開始する
if ( window.addEventListener ) {
    window.addEventListener( "DOMContentLoaded", main );
} else {
    window.alert( "対応していないブラウザです" );
    console.error( "window.addEventListener is undefined" );
}

/*
    global
    Timer, 
    FisherYatesShuffle, BubbleSort, SelectionSort, InsertionSort, QuickSort, MergeSort, 
*/
