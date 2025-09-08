/**
 * @license
 * MIT License
 *
 * Copyright (c) 2025 MAMEDUL ISLAM
 */

'use strict';

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
    if (/[^0-9-\s]+/.test(num)) return false;
    let nCheck = 0, bEven = false;
    num = num.replace(/\D/g, "");
    for (var n = num.length - 1; n >= 0; n--) {
        var cDigit = num.charAt(n),
            nDigit = parseInt(cDigit, 10);
        if (bEven && (nDigit *= 2) > 9) nDigit -= 9;
        nCheck += nDigit;
        bEven = !bEven;
    }
    return (nCheck % 10) == 0;
};

// --- Field Validator Class ---
class Validator {
    constructor(type) {
        this._type = type;
        this._rules = [];
        this._transformers = [];
        this._flags = { optional: true, nullable: false, strip: false };
        this._meta = {};
        this._hasAsync = false;
        this._schemaObject = null; // For object().keys()
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
    concat(schema) { this._rules.push(...schema._rules); this._transformers.push(...schema._transformers); this._hasAsync = this._hasAsync || schema._hasAsync; return this; }
    meta(info) { this._meta = { ...this._meta, ...info }; return this; }
    message(customMessage) { if (this._rules.length > 0) { this._rules[this._rules.length - 1].customMessage = customMessage; } return this; }
    
    // --- String & Number Shared ---
    min(limit) { this.addRule('min', (v, o) => (typeof v === 'number' ? v >= resolveRef(limit, o) : v.length >= resolveRef(limit, o)), `must be at least ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
    max(limit) { this.addRule('max', (v, o) => (typeof v === 'number' ? v <= resolveRef(limit, o) : v.length <= resolveRef(limit, o)), `must be at most ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
    length(limit) { this.addRule('length', (v, o) => v.length === resolveRef(limit, o), `length must be exactly ${limit.isRef ? `{${limit.key}}` : limit}`); return this; }
    
    // --- String-Specific Methods ---
    pattern(regex, msg) { this.addRule('pattern', v => regex.test(v), msg || 'fails to match pattern'); return this; }
    creditCard() { this.addRule('creditCard', creditCardCheck, 'must be a valid credit card number'); return this; }
    ip4() { this.addRule('ip4', v => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v), 'must be a valid IPv4 address'); return this; }
    ip6() { this.addRule('ip6', v => /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(v), 'must be a valid IPv6 address'); return this; }
    ip() { this.addRule('ip', v => ipv4Regex.test(v) || ipv6Regex.test(v), 'must be a valid IP address'); return this; }
    email() { this.addRule('email', v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'must be a valid email.'); return this; }
    uuid() { this.addRule('uuid', v => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v), 'must be a valid UUID'); return this; }
    hex() { this.addRule('hex', v => /^[a-fA-F0-9]+$/.test(v), 'must be a hexadecimal string'); return this; }
    token() { this.addRule('token', v => /^[a-zA-Z0-9_]+$/.test(v), 'must be a valid token'); return this; }
    isoDate() { this.addRule('isoDate', v => !isNaN(new Date(v).getTime()), 'must be a valid ISO date'); return this; }
    trim() { this.addTransformer(v => typeof v === 'string' ? v.trim() : v); return this; }
    lowercase() { this.addTransformer(v => typeof v === 'string' ? v.toLowerCase() : v); return this; }
    uppercase() { this.addTransformer(v => typeof v === 'string' ? v.toUpperCase() : v); return this; }
    alphanum() { this.addRule('alphanum', v => /^[a-zA-Z0-9]+$/.test(v), 'must only contain alphanumeric characters.'); return this; }

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
    
    // Add this inside the ObjectValidator class
    assert(path, schema, message) { 
        this.objectRules.push({ type: 'assert', path, schema, message }); 
        return this; 
    }

    
    // --- Internal Helpers ---
    addRule(type, validate, message, options) { this._rules.push({ type, validate, message, options }); }
    addTransformer(transform) { this._transformers.push(transform); }

    // --- Internal SYNC Validation Logic ---
    _validateSync(value, originalObj) {
        if (this._hasAsync) throw new Error('Schema has async rules, use .validateAsync() instead.');
        
        let currentValue = value;
        for (const transformer of this._transformers) {
            currentValue = transformer(currentValue);
        }

        if ( typeof this._flags.strip !== 'undefined' && this._flags.strip) return { value: undefined };
        if (!isPresent(currentValue)) {
            if (!this._flags.optional) throw new Error('is required');
            return { value: currentValue };
        }
        if (this._flags.nullable && currentValue === null) return { value: null };

        for (const rule of this._rules) {
            if (!rule.validate(currentValue, originalObj)) {
                throw new Error(rule.customMessage || rule.message);
            }
        }
        
        const itemsRule = this._rules.find(r => r.type === 'items');
        if (this._type === 'array' && itemsRule) {
            const itemSchema = itemsRule.options.schema;
            if (!Array.isArray(currentValue)) throw new Error('must be an array'); // Added type check here
            const validatedArray = [];
            for (let i = 0; i < currentValue.length; i++) {
                // This is the core of the fix. It now correctly calls the item's own validator.
                const { value: itemValue, error: itemError } = itemSchema.validate(currentValue[i]);
                if(itemError) throw new Error(`[at index ${i}] ${itemError.details[0].message}`);
                
                // Correctly handles stripped items by checking if the returned value is undefined.
                if (itemValue !== undefined) {
                    validatedArray.push(itemValue);
                }
            }
            currentValue = validatedArray;
        }

        if ((this._type === 'object' || this._type === 'any') && this._schemaObject) {
            const { value: objValue, error: objError } = schema.object(this._schemaObject).validate(currentValue);
            if(objError) throw new Error(objError.details.map(d => `${d.field}: ${d.message}`).join(', '));
            currentValue = objValue;
        }
        
        return { value: currentValue };
    }

    // --- Internal ASYNC Validation Logic ---
    async _validateAsync(value, originalObj) {
        let currentValue = value;
        for (const transformer of this._transformers) {
            currentValue = transformer(currentValue);
        }

        if (this._flags.strip) return { value: undefined };
        if (!isPresent(currentValue)) {
            if (!this._flags.optional) throw new Error('is required');
            return { value: currentValue };
        }
        if (this._flags.nullable && currentValue === null) return { value: null };

        for (const rule of this._rules) {
            const isValid = await Promise.resolve(rule.validate(currentValue, originalObj));
            if (!isValid) throw new Error(rule.customMessage || rule.message);
        }

        const itemsRule = this._rules.find(r => r.type === 'items');
        if (this._type === 'array' && itemsRule) {
            const itemSchema = itemsRule.options.schema;
            currentValue = await Promise.all(currentValue.map(async (item, i) => {
                const { value: itemValue, error: itemError } = await itemSchema.validateAsync(item);
                if(itemError) throw new Error(`[at index ${i}] ${itemError.details[0].message}`);
                return typeof itemSchema._flags.strip !== 'undefined' && itemSchema._flags.strip ? undefined : itemValue;
            })).then(results => results.filter(v => v !== undefined));
        }
        
        if ((this._type === 'object' || this._type === 'any') && this._schemaObject) {
            const { value: objValue, error: objError } = await schema.object(this._schemaObject).validateAsync(currentValue);
            if(objError) throw new Error(objError.details.map(d => `${d.field}: ${d.message}`).join(', '));
            currentValue = objValue;
        }
        
        return { value: currentValue };
    }
    
    // --- Public Facing Methods for individual field validation ---
    validate(value) {
        try {
            const { value: validatedValue } = this._validateSync(value, {});
            return { value: validatedValue, error: null };
        } catch (error) {
            return { value, error: new ValidationError([{ message: error.message }]) };
        }
    }

    async validateAsync(value) {
        try {
            const { value: validatedValue } = await this._validateAsync(value, {});
            return { value: validatedValue, error: null };
        } catch (error) {
            return { value, error: new ValidationError([{ message: error.message }]) };
        }
    }
}

// --- Object Validator Class ---
class ObjectValidator {
    constructor(schemaMap, options = {}) {
        this.schemaMap = schemaMap;
        this.options = { abortEarly: true, stripUnknown: false, ...options };
        this.objectRules = [];
        this.hasAsync = Object.values(schemaMap).some(s => s._hasAsync);
    }
    
    or(...peers) { this.objectRules.push({ type: 'or', peers }); return this; }
    and(...peers) { this.objectRules.push({ type: 'and', peers }); return this; }
    xor(...peers) { this.objectRules.push({ type: 'xor', peers }); return this; }
    with(key, peers) { this.objectRules.push({ type: 'with', key, peers }); return this; }
    without(key, peers) { this.objectRules.push({ type: 'without', key, peers }); return this; }

    _checkObjectRules(obj, errors) {
        for (const rule of this.objectRules) {
            try {
                const presentPeers = rule.peers.filter(p => isPresent(obj[p]));
                if (rule.type === 'or' && presentPeers.length === 0) throw new Error(`At least one of [${rule.peers.join(', ')}] is required.`);
                if (rule.type === 'and' && presentPeers.length > 0 && presentPeers.length !== rule.peers.length) throw new Error(`All of [${rule.peers.join(', ')}] are required when one is present.`);
                if (rule.type === 'xor' && presentPeers.length !== 1) throw new Error(`Exactly one of [${rule.peers.join(', ')}] is required.`);
                if (rule.type === 'with' && isPresent(obj[rule.key]) && presentPeers.length !== rule.peers.length) throw new Error(`'${rule.key}' requires all of [${rule.peers.join(', ')}].`);
                if (rule.type === 'without' && isPresent(obj[rule.key]) && presentPeers.length > 0) throw new Error(`'${rule.key}' forbids any of [${rule.peers.join(', ')}].`);
                if (rule.type === 'assert') {
                    const resolvePath = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
                    const value = resolvePath(obj, rule.path);
                    const { error } = rule.schema.validate(value);
                    if (error) {
                        const defaultMessage = `path '${rule.path}' failed validation: ${error.details[0].message}`;
                        throw new Error(rule.message || defaultMessage);
                    }
                }
            } catch(err) {
                 errors.push({ message: err.message, field: rule.peers.join('|'), type: rule.type });
                 if (this.options.abortEarly) throw new ValidationError(errors);
            }
        }
    }
    
    _validateObjectSync(obj) {
        if (this.hasAsync) throw new Error('Schema has async rules, use .validateAsync() instead.');
        
        const validatedObj = {};
        const errors = [];
        const initialObj = obj || {};

        let workingObj = { ...initialObj };
        if (this.options.stripUnknown) {
            const knownKeys = new Set(Object.keys(this.schemaMap));
            workingObj = Object.keys(workingObj).filter(key => knownKeys.has(key)).reduce((acc, key) => ({...acc, [key]: workingObj[key]}), {});
        }

        const allKeys = new Set([...Object.keys(workingObj), ...Object.keys(this.schemaMap)]);

        for (const key of allKeys) {
            const fieldSchema = this.schemaMap[key];
            const value = workingObj[key];
            
            if (!fieldSchema) {
                validatedObj[key] = value;
                continue;
            }

            const { value: validatedValue, error } = fieldSchema.validate(value);
            
            if (error) {
                errors.push({ field: key, message: error.details[0].message, type: 'field' });
                if (this.options.abortEarly) throw new ValidationError(errors);
            }
            
            if(!(typeof fieldSchema._flags.strip !== "undefined" && fieldSchema._flags.strip)) {
               validatedObj[key] = validatedValue;
            }
        }
        
        this._checkObjectRules(validatedObj, errors);

        if (errors.length > 0) throw new ValidationError(errors);
        return { value: validatedObj, error: null };
    }

    async _validateObjectAsync(obj) {
        const validatedObj = {};
        const errors = [];
        const initialObj = obj || {};

        let workingObj = { ...initialObj };
        if (this.options.stripUnknown) {
            const knownKeys = new Set(Object.keys(this.schemaMap));
            workingObj = Object.keys(workingObj).filter(key => knownKeys.has(key)).reduce((acc, key) => ({...acc, [key]: workingObj[key]}), {});
        }
        
        const allKeys = new Set([...Object.keys(workingObj), ...Object.keys(this.schemaMap)]);
        for (const key of allKeys) {
            const fieldSchema = this.schemaMap[key];
            const value = workingObj[key];

            if (!fieldSchema) {
                validatedObj[key] = value;
                continue;
            }
            
            const { value: validatedValue, error } = await fieldSchema.validateAsync(value);
            
            if (error) {
                errors.push({ field: key, message: error.details[0].message, type: 'field' });
                if (this.options.abortEarly) throw new ValidationError(errors);
            }
            
            if(!(typeof fieldSchema._flags.strip !== 'undefined' && fieldSchema._flags.strip)) {
               validatedObj[key] = validatedValue;
            }
        }
        
        this._checkObjectRules(validatedObj, errors);

        if (errors.length > 0) throw new ValidationError(errors);
        return { value: validatedObj, error: null };
    }

    validate(obj) {
        try {
            return this._validateObjectSync(obj);
        } catch(error) {
            return { value: obj, error };
        }
    }

    async validateAsync(obj) {
        try { return await this._validateObjectAsync(obj); }
        catch(error) { return { value: obj, error }; }
    }
}

// --- Schema Builder ---
const schema = {
    string: () => new Validator('string'),
    number: () => new Validator('number'),
    boolean: () => new Validator('boolean'),
    array: () => new Validator('array'),
    object: (schemaMap, options) => new ObjectValidator(schemaMap, options),
    date: () => new Validator('date'),
    any: () => new Validator('any'),
};

module.exports = { schema, ref, ValidationError };