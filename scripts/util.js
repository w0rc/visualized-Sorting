"use strict";

/**
    乱数生成（XorShift：シードが固定できる乱数生成器として採用）
 */
class XorShift {
    static MAX = 0xffffffff;
    constructor ( seed = 88675123 ) {
        [this.x, this.y, this.z, this.x] = [123456789, 362436069, 521288629, seed];
        this.iterator = this.generator();
    }
    * generator () {
        for ( ;; ) {
            this.t = this.x ^ ( this.x << 11 );
            [this.x, this.y, this.z] = [this.y, this.z, this.w];
            this.w = this.w ^ ( this.w >> 19 ) ^ ( this.t ^ ( this.t >> 8 ) );
            if ( this.t >>> 0 === XorShift.MAX ) continue;
            yield ( this.t >>> 0 ) / XorShift.MAX;
        }
    }
    next () {
        return this.iterator.next().value;
    }
}

/**
    タイマー
 */
class Timer {
    constructor () {
        this.running = false;
        this.elapsed_time = 0;
        this.start_time = 0;
    }
    start () {
        this.running = true;
        this.elapsed_time = 0;
        this.start_time = performance.now();
    }
    reset () {
        this.running = false;
        this.elapsed_time = 0;
        this.start_time = performance.now();
    }
    resume () {
        if ( !this.running ) {
            this.running = true;
            this.start_time = performance.now();
        }
    }
    pause () {
        if ( this.running ) {
            this.running = false;
            this.elapsed_time = this.elapsed_time + ( performance.now() - this.start_time );
        }
    }
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
