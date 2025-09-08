(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.chainSchemaValidator = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	/**
	 * @license
	 * MIT License
	 *
	 * Copyright (c) 2025 MAMEDUL ISLAM
	 */

	// --- Error Class ---
	class ValidationError extends Error {
	    constructor(details) {
	        const message = details.map(d => d.message).join('. ');
	        super(message);
	        this.name = 'ValidationError';
	        this.details = details;
	        this.statusCode = 400;
	    }
	}

	// --- Utilities ---
	const ref = (key) => ({ isRef: true, key });
	const resolveRef = (value, obj) => (value && value.isRef ? obj[value.key] : value);
	const isPresent = val => val !== undefined && val !== null;
	const creditCardCheck = (num) => {
	    let arr = (num + '').split('').reverse().map(x => parseInt(x));
	    let lastDigit = arr.splice(0, 1)[0];
	    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val *= 2) > 9 ? val - 9 : val)), 0);
	    return (sum + lastDigit) % 10 === 0;
	};

	// --- Main Validator Class ---
	class Validator {
	    constructor(type) {
	        this._type = type;
	        this._rules = [];
	        this._transformers = [];
	        this._flags = {
	            optional: true,
	            nullable: false,
	            strip: false
	        };
	        this._meta = {};
	        this._hasAsync = false;
	    }

	    // --- General / Utility Methods ---
	    required() { this._flags.optional = false; return this; }
	    optional() { this._flags.optional = true; return this; }
	    nullable() { this._flags.nullable = true; return this; }
	    forbidden() { this.addRule('forbidden', v => !isPresent(v), 'is forbidden'); return this; }
	    strip() { this._flags.strip = true; return this; }
	    default(value) { this.addTransformer(val => (val === undefined || val === null) ? value : val); return this; }
	    valid(...values) { this.addRule('valid', v => values.includes(v), `must be one of [${values.join(', ')}]`); return this; }
	    invalid(...values) { this.addRule('invalid', v => !values.includes(v), `must not be one of [${values.join(', ')}]`); return this; }
	    oneOf(values) { return this.valid(...values); }
	    notOneOf(values) { return this.invalid(...values); }
	    transform(fn) { this.addTransformer(fn); return this; }
	    custom(fn, msg) { this.addRule('custom', fn, msg || 'failed custom validation'); return this; }
	    customAsync(fn, msg) { this._hasAsync = true; this.addRule('customAsync', fn, msg || 'failed async validation'); return this; }
	    concat(schema) { this._rules.push(...schema._rules); this._transformers.push(...schema._transformers); return this; }
	    meta(info) { this._meta = { ...this._meta, ...info }; return this; }
	    message(customMessage) { if (this._rules.length > 0) { this._rules[this._rules.length - 1].customMessage = customMessage; } return this; }

	    // --- String-Specific Methods ---
	    pattern(regex, msg) { this.addRule('pattern', v => regex.test(v), msg || 'fails to match pattern'); return this; }
	    min(limit) { this.addRule('min', (v, o) => v.length >= resolveRef(limit, o), `length must be at least ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
	    max(limit) { this.addRule('max', (v, o) => v.length <= resolveRef(limit, o), `length must be at most ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
	    length(limit) { this.addRule('length', (v, o) => v.length === resolveRef(limit, o), `length must be exactly ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
	    creditCard() { this.addRule('creditCard', creditCardCheck, 'must be a valid credit card number'); return this; }
	    ip() { this.addRule('ip', v => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v), 'must be a valid IP address'); return this; }
	    uuid() { this.addRule('uuid', v => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v), 'must be a valid UUID'); return this; }
	    hex() { this.addRule('hex', v => /^[a-fA-F0-9]+$/.test(v), 'must be a hexadecimal string'); return this; }
	    token() { this.addRule('token', v => /^[a-zA-Z0-9_]+$/.test(v), 'must be a valid token'); return this; }
	    isoDate() { this.addRule('isoDate', v => !isNaN(new Date(v).getTime()), 'must be a valid ISO date'); return this; }
	    trim() { this.addTransformer(v => typeof v === 'string' ? v.trim() : v); return this; }
	    lowercase() { this.addTransformer(v => typeof v === 'string' ? v.toLowerCase() : v); return this; }
	    uppercase() { this.addTransformer(v => typeof v === 'string' ? v.toUpperCase() : v); return this; }

	    // --- Number-Specific Methods ---
	    greater(limit) { this.addRule('greater', (v, o) => v > resolveRef(limit, o), `must be greater than ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
	    less(limit) { this.addRule('less', (v, o) => v < resolveRef(limit, o), `must be less than ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
	    integer() { this.addRule('integer', Number.isInteger, 'must be an integer'); return this; }
	    positive() { this.addRule('positive', v => v > 0, 'must be positive'); return this; }
	    negative() { this.addRule('negative', v => v < 0, 'must be negative'); return this; }
	    port() { this.addRule('port', v => Number.isInteger(v) && v >= 0 && v <= 65535, 'must be a valid port'); return this; }

	    // --- Array-Specific Methods ---
	    items(schema) { this.addRule('items', () => true, '', { schema }); return this; }
	    unique() { this.addRule('unique', arr => new Set(arr).size === arr.length, 'must contain unique values'); return this; }
	    has(schema) { this.addRule('has', () => true, 'must contain at least one required item', { schema }); return this; }
	    single() { this.addTransformer(v => Array.isArray(v) ? v : [v]); return this; }
	    
	    // --- Object-Specific Methods ---
	    keys(schemaObject) { this._schemaObject = schemaObject; return this; }
	    
	    // --- Internal Helpers ---
	    addRule(type, validate, message, options) { this._rules.push({ type, validate, message, options }); }
	    addTransformer(transform) { this._transformers.push(transform); }

	    // --- Main Validation Logic ---
	    async _validate(value, originalObj) {
	        if (this._flags.strip) return { value: undefined, error: null };
	        if (!isPresent(value)) {
	            if (!this._flags.optional) return { error: 'is required' };
	            return { value, error: null };
	        }
	        if (this._flags.nullable && value === null) return { value: null, error: null };

	        let currentValue = value;
	        for (const transformer of this._transformers) {
	            currentValue = transformer(currentValue);
	        }
	        
	        for (const rule of this._rules) {
	            let isValid;
	            if (rule.type === 'customAsync') {
	                isValid = await rule.validate(currentValue, originalObj);
	            } else {
	                isValid = rule.validate(currentValue, originalObj);
	            }
	            if (!isValid) return { error: rule.customMessage || rule.message };
	        }

	        // Type-specific logic
	        if (this._type === 'array' && this._rules.some(r => r.type === 'items')) {
	            const itemSchema = this._rules.find(r => r.type === 'items').options.schema;
	            const validatedArray = [];
	            for (let i = 0; i < currentValue.length; i++) {
	                const { value: itemValue, error: itemError } = await itemSchema._validate(currentValue[i], originalObj);
	                if(itemError) return { error: `[at index ${i}] ${itemError}` };
	                if(!itemSchema._flags.strip) validatedArray.push(itemValue);
	            }
	            currentValue = validatedArray;
	        }

	        if (this._type === 'object' && this._schemaObject) {
	            const { value: objValue, error: objError } = await schema.object(this._schemaObject)._validateObject(currentValue);
	             if(objError) return { error: objError.details.map(d => `${d.field}: ${d.message}`).join(', ')}
	            currentValue = objValue;
	        }
	        
	        return { value: currentValue, error: null };
	    }
	}

	class ObjectValidator {
	    constructor(schemaObject, options = {}) {
	        this.schema = schemaObject;
	        this.options = { abortEarly: true, stripUnknown: false, ...options };
	        this.hasAsync = Object.values(schemaObject).some(s => s._hasAsync);
	    }
	    
	    async _validateObject(obj) {
	        const validatedObj = {};
	        const errors = [];
	        const allKeys = new Set([...Object.keys(obj), ...Object.keys(this.schema)]);

	        for (const key of allKeys) {
	            const fieldSchema = this.schema[key];
	            const value = obj[key];
	            
	            if (!fieldSchema) {
	                if (!this.options.stripUnknown) validatedObj[key] = value;
	                continue;
	            }

	            const { value: validatedValue, error } = await fieldSchema._validate(value, obj);
	            
	            if (error) {
	                errors.push({ field: key, message: error, type: 'field' });
	                if (this.options.abortEarly) throw new ValidationError(errors);
	            }
	            
	            if(!fieldSchema._flags.strip) {
	               validatedObj[key] = validatedValue;
	            }
	        }
	        if (errors.length > 0) throw new ValidationError(errors);
	        return { value: validatedObj, error: null };
	    }
	    
	    async validateAsync(obj) {
	        try {
	            return await this._validateObject(obj);
	        } catch(error) {
	            return { value: obj, error };
	        }
	    }

	    validate(obj) {
	        if (this.hasAsync) throw new Error('Schema has async rules, use validateAsync()');
	        let result;
	        let syncError;
	        this.validateAsync(obj).then(res => result = res).catch(err => syncError = { value: obj, error: err });
	        if(syncError) return syncError;
	        return result;
	    }
	}

	// --- Schema Builder ---
	const schema = {
	    string: () => new Validator('string'),
	    number: () => new Validator('number'),
	    boolean: () => new Validator('boolean'),
	    array: () => new Validator('array'),
	    object: (schemaObject, options) => new ObjectValidator(schemaObject, options),
	    date: () => new Validator('date'),
	    any: () => new Validator('any'),
	};

	var chainSchemaValidator = { schema, ref, ValidationError };

	var index = /*@__PURE__*/getDefaultExportFromCjs(chainSchemaValidator);

	return index;

}));
