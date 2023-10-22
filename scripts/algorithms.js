'use strict'

/* --------可視化するアルゴリズム-------- */
/**
    シャッフル（Fisher-Yatesのシャッフル） O(n)
 */
function* ShuffleGenerator(arr){
    let n = 0;
    for(let i = arr.length - 1; i > 0; i--){
        const r = Math.floor(Math.random() * (i + 1));
        yield [i, r, i];
        n++;
        [arr[i], arr[r]] = [arr[r], arr[i]];
    }
    return n;
}
/**
    バブルソート O(n^2)
    */
function* BubbleSortGenerator(arr){
    let n = 0, left = 0, right = 0;
    const len = arr.length;
    for(let i=0; i<len; i++){
        for(let j=0; j<len-i-1; j++){
            if(arr[j] > arr[j+1]){
                [left,right] = [j, j+1];
                [arr[j],[arr[j+1]]] = [arr[j+1],[arr[j]]];
            }
            yield [j, left, right];
            n++;
        }
    }
    return n;
}
/**
    選択ソート O(n^2)
    */
function* SelectionSortGenerator(arr){
    let n = 0;
    const len = arr.length;
    for(let i=0; i<len; i++){
        let min = i;
        for(let j=i; j<len; j++){
            if(arr[j] < arr[min]){
                min = j;
            }
            yield [j, min, i];
            n++;
        }
        [arr[i], arr[min]] = [arr[min], arr[i]];
    }
    return n;
}
/**
 *  挿入ソート O(n^2)
 */
function* InsertionSortGenerator(arr){
    let n = 0;
    const len = arr.length;
    for(let i=1; i<len; i++){
        let j = i;
        while(j>0 && arr[j-1] > arr[j]){
            yield [j, j, j-1];
            [arr[j-1], arr[j]] = [arr[j], arr[j-1]];
            j--;
            n++;
        }
    }
    return n;
}