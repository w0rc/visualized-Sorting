'use strict'

/* --------データ準備用のメソッド-------- */
/**
    乱数生成（XorShift：シード固定できる乱数生成器）
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
    ソートアルゴリズム実行前に使用する）
 */
function shuffle(arr, seed){
    const XS = new XorShift(seed ? seed : 12345678);
    for(let i = arr.length - 1; i > 0; i--){
        const r = Math.floor(XS.rand() * (i + 1));
        [arr[i], arr[r]] = [arr[r], arr[i]];
    }
}

/* --------描画関連メソッド-------- */
/**
    タイマー
 */
class Timer{
    constructor(){ this.start = performance.now(); };
    run(){ this.start = performance.now(); };
    stop(){ return performance.now() - this.start; };
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
            if(i===flags[0]) context.fillStyle = "#b03333"; // チェック中のデータ
            if(i===flags[1]) context.fillStyle = "#33b033"; // 交換対象（小さい)
            if(i===flags[2]) context.fillStyle = "#3333b0"; // 交換対象（大きい）
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
    shuffle(data, 12345678);
    // 可視化するアルゴリズムのイテレータ
    const Generators = [
        BubbleSortGenerator,
        SelectionSortGenerator,
        InsertionSortGenerator
    ];
    let genIndex = 0;
    let generator = Generators[genIndex];
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
        interval : 10,
        done : false,
    };
    function loop( timestamp ){
        // 描画時間を調整
        if( handler.interval > timestamp - handler.start ){
            handler.id = window.requestAnimationFrame(loop);
            return;
        }else{
            handler.start = timestamp;
        }

        // イテレータを進める
        const result = iterator.next();
        // イテレータが完了したら終了する
        if( result.done ){
            draw(canvas, context, data);
            handler.id = window.cancelAnimationFrame(handler.id);
            console.info(generator.name+"／ ループ回数："+result.value+" ／ 実行時間："+timer.stop()+"[ms]");

            // 次のアルゴリズムを呼び出す
            shuffle(data, 12345678);
            generator = Generators[++genIndex];
            if( generator ){
                iterator = generator(data);
                handler.id = window.requestAnimationFrame(loop);
                timer.run();
            }else{
                handler.done = true;
            }
            return;
        }else{
        // 描画して次のループへ
            draw(canvas, context, data, result.value );
            handler.id = window.requestAnimationFrame(loop);
        }
    }

    // イベントハンドラの設定
    window.addEventListener('click', (event)=>{
        // console.log(event);
        if( handler.done ) return;
        // クリックしたら一時停止
        if( !handler.id ){
            handler.id = window.requestAnimationFrame(loop);
        }else{
            handler.id = window.cancelAnimationFrame(handler.id);
        }
    });
    window.addEventListener('resize', (event) => {
        // console.log(event);
        // 画面のリサイズが発生したらキャンバスサイズもリサイズ
        setCanvas();
        draw(canvas, context, data);
    });

    // ループの開始
    draw( canvas, context, data );
    handler.id = window.requestAnimationFrame(loop);
    timer.run();
}

// DOMContentLoaded 契機に処理を開始する
if( window.addEventListener ) {
    window.addEventListener( 'DOMContentLoaded', main );
} else {
    console.error("window.addEventListener is undefined");
    window.alert("対応していないブラウザです");
}
