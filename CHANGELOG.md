# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/ "null"), and this project adheres to a `YYYY.MM.DD{patch}` format.

## [2025.9.8] - 2025-09-08

### Newly Built & Published

*   **Complete API Overhaul**: Entire library has been newly built and published with a fully refactored, feature-complete API inspired by Joi. The core architecture is now more robust, extensible, and powerful.
    
*   **Schema Composition Model**: Newly added builder pattern. Individual field schemas (`schema.string()`, `schema.number()`, etc.) can now be composed into a main `schema.object()` validator.
    
*   **Massive New Method Library**: A brand-new, comprehensive suite of methods for every data type has been introduced, covering almost all conceivable validation and transformation use cases:
    
    *   **General**: Newly added `.optional()`, `.nullable()`, `.forbidden()`, `.strip()`, `.valid()`, `.invalid()`, `.transform()`, `.concat()`, `.meta()`.
        
    *   **String**: Newly added `.pattern()`, `.creditCard()`, `.ip()`, `.uuid()`, `.hex()`, `.token()`, `.isoDate()`, and additional string transformers.
        
    *   **Number**: Newly added `.greater()`, `.less()`, `.integer()`, `.positive()`, `.negative()`, `.port()`.
        
    *   **Array**: Newly added `.items(schema)`, `.unique()`, `.has(schema)`, `.single()`.
        
    *   **Object**: Newly enhanced `schema.object()` for nested validation and deep schema composition.
        
*   **Enhanced Error and Value Handling**: Newly implemented `.validate()` and `.validateAsync()` methods on `schema.object()` return a consistent `{ value, error }` object.

### Breaking Changes (Newly Applied)

*   Replaced old `schema(obj)` factory with the newly built composition model (`schema.object({ key: schema.string() })`).
    
*   Removed old object-level logical rules (`.or`, `.xor`, `.with`, etc.) and introduced a more powerful custom validation approach.
    
*   Reorganized all validation methods by data type (e.g., `.min()` now behaves differently depending on whether it’s on a string, number, or array schema).

## [2025.9.8.7] - 2025-09-08

### Newly Built & Added

*   Newly added advanced logical rules: `.xor`, `.with`, `.without`.
    
*   Newly introduced data "fixer" methods: `.toLowerCase`, `.truncate`, `.replace`.
    
*   Newly built number and string validators: `.integer`, `.positive`, `.alphanum`, `.guid`.

_For older changes, see previous versions._
