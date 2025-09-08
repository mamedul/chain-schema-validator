const { schema, ref, ValidationError } = require('./index');

let tests = 0;
let passed = 0;

async function test(name, fn) {
    tests++;
    try {
        await fn();
        console.log(`✅ Passed: ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ Failed: ${name}`);
        console.error(error);
        process.exit(1);
    }
}

console.log('Running chain-schema-validator tests...\n');

(async () => {
    await test('should validate required, optional, nullable, and forbidden', () => {
        const s = {
            req: schema.string().required(),
            opt: schema.string().optional(),
            nullbl: schema.string().nullable(),
            forbid: schema.string().forbidden()
        };
        const validator = schema.object(s);

        if (validator.validate({ req: 'a', opt: 'a', nullbl: null }).error) throw new Error('Base case failed');
        const { error: reqError } = validator.validate({});
        if (!reqError || !reqError.details.some(d => d.field === 'req')) throw new Error('Required failed');
        
        if (validator.validate({ req: 'a', nullbl: 'a' }).error) throw new Error('Nullable should allow string');
        if (validator.validate({ req: 'a', nullbl: null }).error) throw new Error('Nullable failed');
        
        const { error: forbidError } = validator.validate({ req: 'a', forbid: 'a' });
        if (!forbidError || !forbidError.details.some(d => d.field === 'forbid')) throw new Error('Forbidden failed');
    });

    await test('should strip fields', () => {
        const s = {
            name: schema.string(),
            secret: schema.string().strip()
        };
        const { value } = schema.object(s).validate({ name: 'a', secret: 'b' });
        if ('secret' in value) throw new Error('Strip failed');
    });

    await test('should handle default values', () => {
        const s = {
            role: schema.string().default('user')
        };
        const { value } = schema.object(s).validate({});
        if (value.role !== 'user') throw new Error('Default failed');
    });
    
    await test('should validate .valid() and .invalid()', () => {
        const s = {
            status: schema.string().valid('on', 'off'),
            level: schema.number().invalid(0)
        };
        const validator = schema.object(s);
        if (validator.validate({ status: 'on', level: 1 }).error) throw new Error('Valid case failed');
        if (!validator.validate({ status: 'pending' }).error) throw new Error('Valid() should have failed');
        if (!validator.validate({ level: 0 }).error) throw new Error('Invalid() should have failed');
    });

    await test('should handle string validations and transformations', () => {
        const s = {
            username: schema.string().trim().lowercase().min(3).token(),
            pin: schema.string().length(4).hex(),
            card: schema.string().creditCard(),
            website: schema.string().lowercase()
        };
        const validator = schema.object(s);
        const { value, error } = validator.validate({
            username: '  USER_123 ',
            pin: 'a1b2',
            card: '49927398716',
            website: 'HTTP://EXAMPLE.COM'
        });
        if (error) throw error;
        if (value.username !== 'user_123' || value.pin !== 'a1b2' || value.website !== 'http://example.com') {
            throw new Error('String methods failed');
        }
    });

    await test('should handle number validations', () => {
        const s = {
            age: schema.number().integer().positive().greater(17),
            score: schema.number().less(100),
            portNum: schema.number().port()
        };
        const validator = schema.object(s);
        if (validator.validate({ age: 18, score: 99, portNum: 8080 }).error) throw new Error('Valid number case failed');
        if (!validator.validate({ age: 17.5 }).error) throw new Error('Integer failed');
        if (!validator.validate({ age: 17 }).error) throw new Error('Greater failed');
        if (!validator.validate({ score: 100 }).error) throw new Error('Less failed');
        if (!validator.validate({ portNum: 99999 }).error) throw new Error('Port failed');
    });
    
    await test('should handle array validations with items()', () => {
        const itemSchema = schema.object({ id: schema.number().required() });
        const s = {
            tags: schema.array().items(schema.string().alphanum()).unique(),
            users: schema.array().items(itemSchema)
        };
        const validator = schema.object(s, { abortEarly: false });

        if (validator.validate({ tags: ['a', 'b', 'c!']}).error.details[0].field !== 'tags') throw new Error('Item validation failed');
        if (validator.validate({ tags: ['a', 'b', 'a']}).error.details[0].field !== 'tags') throw new Error('Unique failed');
        
        const { value, error } = validator.validate({ users: [{id: 1}, {id: 2}]});
        
        if (error) throw new Error('Valid array case failed');
        if (value.users.length !== 2) throw new Error('Array validation returned wrong length');
    });

    await test('should handle nested objects with .keys()', () => {
        const s = schema.object({
            user: schema.any().keys({
                name: schema.string().required(),
                email: schema.string().email().strip()
            })
        });
        const { value, error } = s.validate({ user: { name: 'John', email: 'j@j.com', extra: true }});
        if (error) throw new Error('Nested validation failed');
        if ('email' in value.user) throw new Error('Nested strip failed');
        if (!('extra' in value.user)) throw new Error('Unknown key was stripped incorrectly');
    });
    
     await test('should handle async custom validation', async () => {
        const isUnique = async (val) => val !== 'taken';
        const s = schema.object({
            username: schema.string().customAsync(isUnique, 'is taken')
        });
        const { error } = await s.validateAsync({ username: 'taken' });
        if (!error || error.details[0].field !== 'username') throw new Error('Async failed');
        if ((await s.validateAsync({ username: 'available' })).error) throw new Error('Async should pass');
    });

    console.log(`\nTests finished: ${passed}/${tests} passed.\n`);
    if (passed !== tests) {
        process.exit(1);
    }
})();