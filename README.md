# Chain Schema Validator - The Perfect Schema Validation

**The perfect, feature-complete, chainable schema-based object validator for Node.js and browsers. Inspired by Joi, rebuilt for ultimate power and flexibility with zero dependencies.**

This is the definitive version of `chain-schema-validator`, designed to handle virtually any validation scenario you can imagine. It provides an expressive, fluent API to define schemas, transform data, and validate complex objects with ease.

<p align="center">
 <a href="https://wa.me/8801847406830?text=Hi%2C%20do%20you%20have%20time%20to%20develop%20or%20update%20my%20website%3F"><img src="https://raw.githubusercontent.com/mamedul/chain-schema-validator/main/chain-schema-validator-banner.png" alt="Contact" width="1000" height="327" style="width: 100%; height: auto;"></a>
</p>

## Key Features

*   **Massive & Comprehensive API:** A huge library of validation methods for every data type.
    
*   **Powerful Data Transformation:** A dedicated pipeline for sanitizing, formatting, and setting defaults on your data _before_ validation.
    
*   **Advanced Conditional & Relational Logic:** Define complex cross-field dependencies with rules like `when`, `with`, and `switch`\-like logic using `keys`.
    
*   **Deeply Nested Validation:** Effortlessly validate complex nested objects and arrays.
    
*   **Asynchronous Support:** Built-in async capabilities for tasks like database lookups.
    
*   **Zero Dependencies:** Lightweight, fast, and secure.
    

## Quick Start

Define individual field schemas, then compose them into an object schema.

```javascript
const { schema, ref } = require('chain-schema-validator');

// 1. Define schemas for individual fields
const usernameSchema = schema.string()
    .trim()
    .lowercase()
    .token()
    .min(3)
    .required();

const passwordSchema = schema.string()
    .min(8)
    .required();

// 2. Compose into an object schema
const registrationSchema = schema.object({
    username: usernameSchema,
    email: schema.string().email().required(),
    password: passwordSchema,
    passwordConfirm: schema.string().valid(ref('password')).required().strip(),
    role: schema.string().default('user'),
    birthYear: schema.number().integer().min(1920).max(2015)
}, {
    abortEarly: false // Report all errors
});

// 3. Validate your data
const userData = {
    username: '  TEST_USER ',
    email: 'test@example.com',
    password: 'password123',
    passwordConfirm: 'password123',
    birthYear: 1990
};

const { value, error } = registrationSchema.validate(userData);

if (error) {
    console.error('❌ Validation failed:', error.details);
} else {
    console.log('✅ Validation passed!');
    console.log('Sanitized Value:', value);
    /*
      Expected output:
      ✅ Validation passed!
      Sanitized Value: {
        username: 'test_user',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        birthYear: 1990
      }
    */
}
```

## API Reference (Overview)

### Schema Types

*   `schema.string()`
    
*   `schema.number()`
    
*   `schema.boolean()`
    
*   `schema.array()`
    
*   `schema.object(schemaMap, options)`
    
*   `schema.date()`
    
*   `schema.any()`
    

### 🟢 General / Utility Methods

*   **State Modifiers:** `.required()`, `.optional()`, `.nullable()`, `.forbidden()`, `.strip()`
    
*   **Defaults & Values:** `.default(value)`, `.valid(...values)`, `.invalid(...values)`
    
*   **Custom Logic:** `.transform(fn)`, `.custom(fn)`, `.customAsync(fn)`
    
*   **Schema Composition:** `.concat(schema)`, `.meta(info)`
    

### 🟢 String-Specific Methods

*   **Transformation:** `.trim()`, `.lowercase()`, `.uppercase()`
    
*   **Validation:** `.min(len)`, `.max(len)`, `.length(len)`, `.pattern(regex)`, `.creditCard()`, `.email()`, `.ip4()`, `.ip6()`, `.ip()`, `.uuid()`, `.hex()`, `.token()`, `.isoDate()`
    

### 🟢 Number-Specific Methods

*   `.min(val)`, `.max(val)`, `.greater(val)`, `.less(val)`, `.integer()`, `.positive()`, `.negative()`, `.port()`
    

### 🟢 Array-Specific Methods

*   `.min(len)`, `.max(len)`, `.length(len)`, `.items(schema)`, `.unique()`, `.has(schema)`, `.single()`
    

### 🟢 Object-Specific Methods

*   `schema.object({ key: schema, ... })` is the primary method.
    
*   **Options:** `{ abortEarly: boolean, stripUnknown: boolean }`
    

## Contributing

This library is now feature-complete and in a stable state. Bug reports are welcome. Please see our [Security Policy](./SECURITY.md "null").

If you need just object validator, then you can see  [objectPropValidator](https://github.com/mamedul/objectpropvalidator "null").

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE "null") file for details.

## Author

This packages codes was created by [**Mamedul Islam**](https://mamedul.github.io/ "null") and open for contribute.

_As a passionate **web developer** with experience in creating interactive and user-friendly web components. Currently *available for freelance projects* or full-time opportunities._

_Helping businesses grow their online presence with custom web solutions. Specializing in **WordPress**, **WooCommerce**, **NodeJS**, and **Shopify**. Building modern, responsive, and high-performance scalable websites with custom made plugins, codes, customizations._


## Changelog

Please see the [CHANGELOG.md](CHANGELOG.md "null") file.