'use strict'

/* --------データ準備用のメソッド-------- */
/**
    乱数生成（XorShift：シードが固定できる乱数生成器として採用）
 */
class XorShift {
    constructor(seed = performance.now()){
        this.tmp = [];
        for(let i=0; i<=4; i++){
            this.tmp[i] = 1812433253*(seed^(seed>>30))+i;
            seed = this.tmp[i];
        }
    };
    rand(){
        [this.tmp[0], this.tmp[1], this.tmp[2], this.tmp[3]] = 
            [this.tmp[1]^(this.tmp[1]<<11), this.tmp[2], this.tmp[3],this.tmp[4]];
        this.tmp[4] = (this.tmp[4]^(this.tmp[4]>>19))^(this.tmp[0]^(this.tmp[0]>>8));
        return (this.tmp[4]/2147483648.0);
    };
};
/**
    シャッフル（Fisher-Yatesのシャッフル）
    ソートアルゴリズム実行前に使用する
 */
function shuffle(arr, seed){
    const RANDOM = new XorShift(seed ? seed : 12345678);
    for(let i = arr.length - 1; i > 0; i--){
        const r = Math.floor(RANDOM.rand() * (i + 1));
        [arr[i], arr[r]] = [arr[r], arr[i]];
    }
}

/* --------描画関連メソッド-------- */
/**
    タイマー
 */
class Timer{
    constructor(){
        this.start = 0;
        this.elapsed = 0;
        this.running = false;
    };
    run(){
        this.running = true;
        this.elapsed = 0;
        this.start = performance.now();
    };
    resume(){
        if(!this.running){
            this.running = true;
            this.start = performance.now();
        }
    };
    pause(){
        if(this.running){
            this.running = false;
            this.elapsed = this.elapsed + (performance.now() - this.start);
        }
    };
    stop(){
        if(this.running){
            this.running = false;
            return this.elapsed + (performance.now() - this.start);    
        }
    };
};
/**
    描画エリアのリサイズとキャンバスの初期化
 */
function setCanvas(){
    // <canvas> 要素のサイズ調整
    document.getElementById("canvas")
        .setAttribute("width", document.getElementById("wrapper").clientWidth);
    document.getElementById("canvas")
        .setAttribute("height", document.getElementById("wrapper").clientHeight);
    
    // キャンバスとコンテキストの取得
    const canvas = document.getElementById("canvas");
    if( !canvas || !canvas.getContext ){
        console.error("canvas is undefined");
        return;
    }
    const context = canvas.getContext("2d");
    if( !context ){
        console.error("context is undefined");
        return;
    }
    return [canvas, context];
};
/**
    対象データを描画する
 */
function draw( canvas, context, data, flags ){
    // 背景を塗りつぶす
    context.fillStyle = "#333333";
    context.fillRect( 0, 0, canvas.width, canvas.height );
    // データをヒストグラムとして描画する
    const length = data.length;
    const dw = canvas.width / length;      //幅の調整
    const dh = canvas.height / (length+1); //高さの調整
    for(let i=0; i<length; i++){
        context.fillStyle = "#aaaaaa";
        if(flags){
            if(i===flags[0]) context.fillStyle = "#b03333";
            if(i===flags[1]) context.fillStyle = "#33b033";
            if(i===flags[2]) context.fillStyle = "#3333b0";
        }
        context.fillRect(
            i*dw, canvas.height-(data[i]*dh), 
            dw, data[i]*dh);
    }
}

/* --------メイン-------- */
function main() {
    // 描画データの準備
    const data = [];
    const num = 32;
    for(let i=0; i<num; i++){
        data[i] = i+1;
    }
    
    // アルゴリズムの可視化
    /*
    テスト：シャッフルの様子を描画する
    const iterator = ShuffleGenerator(data);
    */
    // 描画データをシャッフルする
    shuffle(data);
    // 可視化するアルゴリズムを順番に取り出せるようにする
    const Generators = [
        BubbleSortGenerator,
        SelectionSortGenerator,
        InsertionSortGenerator,
        QuickSortGenerator
    ].values();
    let generator = Generators.next().value;
    let iterator = generator(data);

    // 描画ループ
    // キャンバスとコンテキストを取得
    const [canvas, context] = setCanvas();
    // 時間計測の準備
    const timer = new Timer();
    // 描画ハンドリング用の設定値
    const handler = {
        id : undefined,
        start : performance.now(),
        interval : 1000/30, // default: 1000/30
        done : false,
    };
    function loop( timestamp ){
        // 描画タイミングを調整
        if( handler.interval > timestamp - handler.start ){
            handler.id = window.requestAnimationFrame(loop);
            return;
        }else{
            handler.start = timestamp;
        }
        // イテレータを進める（処理時間計測のため、タイマーのポーズを解除）
        timer.resume();
        const result = iterator.next();
        // イテレータの結果をチェック
        if( result.done ){
            // イテレータが完了した場合
            // タイマーをストップして処理結果をコンソール出力する
            const time = Math.floor(timer.stop()*10.0)/10.0;
            console.info(generator.name+"／ ループ回数："+result.value+" ／ 処理時間："+time+"[ms]");
            // 最終状態で描画してからアニメーションをキャンセル
            draw(canvas, context, data);
            handler.id = window.cancelAnimationFrame(handler.id);

            // 次のアルゴリズムを取り出す
            generator = Generators.next().value;
            if( generator ){
                // データを再度シャッフルしてからアニメーションを再開
                shuffle(data);
                iterator = generator(data);
                handler.id = window.requestAnimationFrame(loop);
                // タイマーはソート処理部分のみ計測するため起動後すぐにポーズ
                timer.run();
                timer.pause();
            }else{
                // 次のアルゴリズムがない場合は終了状態とする
                handler.done = true;
            }
            return;
        }else{
            // イテレータが続く場合
            // 処理時間計測のため、タイマーは次のイテレータ直前までポーズ
            timer.pause();
            // 描画して次のループへ
            draw(canvas, context, data, result.value );
            handler.id = window.requestAnimationFrame(loop);
        }
    }

    // イベントハンドラの設定
    window.addEventListener('click', (event)=>{
        // console.log(event);

        // 終了状態のときは何もしない
        if( handler.done ) return;
        // クリックごとにアニメーションを一時停止／再開する
        if( !handler.id ){
            handler.id = window.requestAnimationFrame(loop);
        }else{
            handler.id = window.cancelAnimationFrame(handler.id);
        }
    });
    window.addEventListener('resize', (event) => {
        // console.log(event);

        // 画面のリサイズが発生したらキャンバスサイズもリサイズする
        setCanvas();
        draw(canvas, context, data);
    });

    // ループの開始
    draw( canvas, context, data );
    handler.id = window.requestAnimationFrame(loop);
    // タイマーはソート処理部分のみ計測するため起動後すぐにポーズ
    timer.run();
    timer.pause();
}

// DOMContentLoaded 契機に処理を開始する
if( window.addEventListener ) {
    window.addEventListener( 'DOMContentLoaded', main );
} else {
    console.error("window.addEventListener is undefined");
    window.alert("対応していないブラウザです");
}
