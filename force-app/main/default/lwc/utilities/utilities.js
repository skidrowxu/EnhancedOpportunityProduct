export const debounce = (fn, duration = 500) => { 
    let timerId;
    return function(...args) {
        clearTimeout(timerId);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        timerId = setTimeout(()=>{
            fn.apply(this, args);
        }, duration)
    }
};

export function deepClone(value){    
    // console.log(value);
    const cache = new Map();
    function _deepClone(_value) {
        if (_value === null || typeof _value !== 'object') {
            return _value;
        }
        if (cache.has(_value)) {
            return cache.get(_value);
        }
        const result = Array.isArray(_value) ? [] : {};
        cache.set(_value, result);
        for (const key in _value) {
            if (Object.hasOwnProperty.call(_value, key)) {
            result[key] = _deepClone(_value[key]);
            }
        }
        // console.log(111111111111)
        // console.log(result);
        return result;
    }
    return _deepClone(value);
    
}