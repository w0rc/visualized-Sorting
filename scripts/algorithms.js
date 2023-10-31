"use strict";

/**
 *  描画用アルゴリズムのベースクラス
 */
class VisualizedAlgorithm {
    /**
     *  描画用アルゴリズムのコンストラクタ
     *  @param {Object} arr 
     */
    constructor ( arr ) {
        this.arr = [...arr];
        this.loops = 0;
        this.swaps = 0;
    }
    /**
     *  処理中のデータを返却する
     *  @returns {Object} 
     */
    yieldProperties ( ...args ) {
        return {
            data: this.arr,
            coloringIndices: args
        }
    }
    /**
     *  処理後のデータを返却する
     *  @returns {Object}
     */
    resultProperties () {
        return {
            data: this.arr,
            loops: this.loops,
            swaps: this.swaps
        }
    }
    /**
     *  処理用のイテレータを返却する
     */
    *generator () {
        yield this.arr;
    }
}

/* --------可視化するアルゴリズム--------*/
/**
 *  バブルソート O(n^2)
 */
class BubbleSort extends VisualizedAlgorithm {
    *generator ( ) {
        let left = 0, right = 0;
        const len = this.arr.length;
        for ( let i = 0; i < len; i++ ) {
            for ( let j = 0; j < len - i - 1; j++ ) {
                if ( this.arr[j] > this.arr[j + 1] ) {
                    [left, right] = [j, j + 1];
                    [this.arr[j], [this.arr[j + 1]]] = [this.arr[j + 1], [this.arr[j]]];
                    this.swaps++;
                }
                yield this.yieldProperties( j, left, right );
                this.loops++;
            }
        }
        return this.resultProperties();
    }
}

/**
 *  選択ソート O(n^2)
 */
class SelectionSort extends VisualizedAlgorithm {
    *generator ( ) {
        const len = this.arr.length;
        for ( let i = 0; i < len; i++ ) {
            let min = i;
            for ( let j = i; j < len; j++ ) {
                if ( this.arr[j] < this.arr[min] ) {
                    min = j;
                }
                yield this.yieldProperties( j, min, i );
                this.loops++;
            }
            [this.arr[i], this.arr[min]] = [this.arr[min], this.arr[i]];
            this.swaps++;
        }
        return this.resultProperties();
    }
}

/**
 *  挿入ソート O(n^2)
 */
class InsertionSort extends VisualizedAlgorithm {
    *generator () {
        const len = this.arr.length;
        for ( let i = 1; i < len; i++ ) {
            let j = i;
            while ( j > 0 && this.arr[j - 1] > this.arr[j] ) {
                yield this.yieldProperties( i, j - 1, j );
                [this.arr[j - 1], this.arr[j]] = [this.arr[j], this.arr[j - 1]];
                j--;
                this.swaps++;
                this.loops++;
            }
        }
        return this.resultProperties();
    }
}

/**
 *  クイックソート O(n log n)
 */
class QuickSort extends VisualizedAlgorithm {
    *generator ( ) {
        const len = this.arr.length;
        yield* this.partition( this.arr, 0, len - 1 );
        return this.resultProperties();
    }
    *partition ( arr, left, right ) {
        const pivot_index = Math.floor( ( left + right ) / 2 );
        const pivot = arr[pivot_index];
        let [i, j] = [left, right];
        for ( ;; ) {
            while ( arr[i] < pivot ) {
                i++;
                this.loops++;
            }
            while ( pivot < arr[j] ) {
                j--;
                this.loops++;
            }
            yield this.yieldProperties( pivot_index, i, j );
            if ( i >= j ) {
                break;
            } else {
                if ( arr[i] !== arr[j] ) {
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    this.swaps++;
                }
                i++;
                j--;
            }
        }
        if ( left < i - 1 ) {
            yield* this.partition( arr, left, i - 1 );
        }
        if ( j + 1 < right ) {
            yield* this.partition( arr, j + 1, right );
        }
    }
}

/**
 *  マージソート O(n log n)
 */
class MergeSort extends VisualizedAlgorithm {
    *generator ( ) {
        const len = this.arr.length;
        yield* this.mergesort( this.arr, 0, len );
        return this.resultProperties();
    }
    *mergesort ( arr, left, right ) {
        const _arr = [];
        if ( left >= right - 1 ) {
            _arr.push( arr[left] );
        } else if ( left == right - 2 ) { 
            if ( arr[left] < arr[right - 1] ) {
                _arr.push( arr[left], arr[right - 1] );
            } else {
                _arr.push( arr[right - 1], arr[left] );
                this.swaps++;
            }
        } else {
            const mid = Math.floor( ( left + right ) / 2 );
            const leftArr = yield* this.mergesort( arr, left, mid );
            const rightArr = yield* this.mergesort( arr, mid, right );
            for ( let [i, j] = [0, 0]; ; ) {
                if ( leftArr[i] < rightArr[j] ) {
                    _arr.push( leftArr[i] );
                    arr[left + i + j] = leftArr[i];
                    i++;
                } else {
                    _arr.push( rightArr[j] );
                    arr[left + i + j] = rightArr[j];
                    j++;
                    this.swaps++;
                }
                yield this.yieldProperties( left + i + j - 1, left + i, mid + j );
                if ( i >= leftArr.length || j >= rightArr.length ) {
                    _arr.push( ...rightArr.slice( j ) );
                    _arr.push( ...leftArr.slice( i ) );
                    _arr.forEach( ( value, index ) => arr[left + index] = value );
                    break;
                }
                this.loops++;
            }
        }
        return _arr;
    }
}

/**
 *  シャッフル（Fisher-Yatesのシャッフル with XorShift） O(n)
 */
class FisherYatesShuffle extends VisualizedAlgorithm {
    constructor ( arr, seed ) {
        super( arr );
        this.rand = new XorShift( seed );
    }
    static shuffle ( arr, seed ) {
        const _arr = [...arr];
        const _rand = new XorShift( seed );
        for ( let i = _arr.length - 1; i > 0; i-- ) {
            const r = Math.floor( _rand.next() * ( i + 1 ) );
            [_arr[i], _arr[r]] = [_arr[r], _arr[i]];
        }
        return _arr;
    }
    *generator ( ) {
        for ( let i = this.arr.length - 1; i > 0; i-- ) {
            const r = Math.floor( ( this.rand.next() ) * ( i + 1 ) );
            yield this.yieldProperties( r, i );
            [this.arr[i], this.arr[r]] = [this.arr[r], this.arr[i]];
            this.swaps++;
            this.loops++;
        }
        return this.resultProperties();
    }
}

/*
    global
    XorShift
*/
/*
    exported
    Shuffle, BubbleSort, SelectionSort, InsertionSort, QuickSort, MergeSort,
    FisherYatesShuffle
*/
