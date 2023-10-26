"use strict";

/**
 *  乱数生成クラス（XorShift）
 *  ＃シードが固定できる乱数生成器として採用
 */
class XorShift {
    /**
     *  XorShift 乱数の最大値
     */
    static MAX = 0xffffffff;
    /**
     *  XorShift
     *  @param {number} seed 乱数のシード値
     */
    constructor ( seed = 88675123 ) {
        [this.x, this.y, this.z, this.w] = [123456789 >>> 0, 362436069 >>> 0, 521288629 >>> 0, seed >>> 0];
        this.iterator = this.generator();
        // 最初に適当に回しておく
        const len = Math.floor( ( this.next() * 99 ) + 1 );
        for ( let i = 0; i < len; i++ ) {
            this.next();
        }
    }
    /**
     *  XorShift のジェネレータ
     *  @private
     */
    *generator () {
        for ( ;; ) {
            this.t = this.x ^ ( this.x << 11 );
            [this.x, this.y, this.z] = [this.y, this.z, this.w];
            this.w = ( ( this.w ^ ( this.w >>> 19 ) ) ^ ( this.t ^ ( this.t >>> 8 ) ) ) >>> 0;
            if ( this.w === XorShift.MAX ) continue;
            yield this.w ;
        }
    }
    /**
     *  乱数を出力する
     *  @returns number [0~1) の乱数
     */
    next () {
        return this.iterator.next().value / XorShift.MAX;
    }
}

/**
    タイマークラス
 */
class Timer {
    constructor () {
        this.running = false;
        this.elapsed_time = 0;
        this.start_time = 0;
    }
    /**
     *  タイマーをスタートする
     */
    start () {
        this.running = true;
        this.elapsed_time = 0;
        this.start_time = performance.now();
    }
    /**
     *  タイマーをリセットする
     */
    reset () {
        this.running = false;
        this.elapsed_time = 0;
        this.start_time = performance.now();
    }
    /**
     *  タイマーを再開する
     */
    resume () {
        if ( !this.running ) {
            this.running = true;
            this.start_time = performance.now();
        }
    }
    /**
     *  タイマーを中断する
     */
    pause () {
        if ( this.running ) {
            this.running = false;
            this.elapsed_time = this.elapsed_time + ( performance.now() - this.start_time );
        }
    }
    /**
     *  タイマーを停止する
     *  @returns number スタートからの経過時間
     */
    stop () {
        if ( this.running ) {
            this.running = false;
            return this.elapsed_time + ( performance.now() - this.start_time );    
        }
    }
}

/*
    exported XorShift, Timer
*/
