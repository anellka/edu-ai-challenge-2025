/**
 * @fileoverview Type-Safe Validation System
 * 
 * A comprehensive TypeScript validation library that provides type-safe validation
 * for primitive types, complex objects, and arrays with detailed error reporting.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const emailValidator = Schema.string().pattern(/^[^@]+@[^@]+\.[^@]+$/);
 * const result = emailValidator.validate("user@example.com");
 * if (result.success) {
 *   console.log("Valid email:", result.data);
 * } else {
 *   console.log("Errors:", result.errors);
 * }
 * ```
 * 
 * @author Type-Safe Validation System
 * @version 1.0.0
 */

/**
 * Result type for validation operations
 * @template T The type of the validated data
 */
type ValidationResult<T> = {
  /** Indicates successful validation */
  success: true;
  /** The validated and potentially transformed data */
  data: T;
} | {
  /** Indicates failed validation */
  success: false;
  /** Array of error messages describing validation failures */
  errors: string[];
};

/**
 * Base interface for all validators
 * @template T The type that this validator validates
 */
interface Validator<T> {
  /**
   * Validates a value against this validator's rules
   * @param value The value to validate (can be any type)
   * @returns ValidationResult indicating success or failure with errors
   */
  validate(value: unknown): ValidationResult<T>;
  
  /**
   * Makes this validator optional (allows undefined/null values)
   * @returns A new OptionalValidator wrapping this validator
   */
  optional(): OptionalValidator<T>;
  
  /**
   * Sets a custom error message for this validator
   * @param message Custom error message to use when validation fails
   * @returns This validator instance for method chaining
   */
  withMessage(message: string): Validator<T>;
}

/**
 * Wrapper validator that makes any validator optional
 * Allows undefined and null values to pass validation
 * 
 * @template T The type of the wrapped validator
 * 
 * @example
 * ```typescript
 * const optionalEmail = Schema.string().pattern(/^[^@]+@[^@]+$/).optional();
 * 
 * optionalEmail.validate(undefined); // { success: true, data: undefined }
 * optionalEmail.validate("test@example.com"); // { success: true, data: "test@example.com" }
 * optionalEmail.validate("invalid"); // { success: false, errors: [...] }
 * ```
 */
class OptionalValidator<T> implements Validator<T | undefined> {
  constructor(private validator: Validator<T>) {}

  validate(value: unknown): ValidationResult<T | undefined> {
    if (value === undefined || value === null) {
      return { success: true, data: undefined };
    }
    return this.validator.validate(value);
  }

  optional(): OptionalValidator<T | undefined> {
    return new OptionalValidator(this);
  }

  withMessage(message: string): Validator<T | undefined> {
    return new OptionalValidator(this.validator.withMessage(message));
  }
}

/**
 * String validator with support for length constraints and pattern matching
 * 
 * @example
 * ```typescript
 * // Basic string validation
 * const nameValidator = Schema.string().minLength(2).maxLength(50);
 * 
 * // Email validation with custom message
 * const emailValidator = Schema.string()
 *   .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
 *   .withMessage('Please enter a valid email address');
 * 
 * // Password validation
 * const passwordValidator = Schema.string()
 *   .minLength(8)
 *   .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
 *   .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number');
 * ```
 */
class StringValidator implements Validator<string> {
  private customMessage?: string;
  private minLen?: number;
  private maxLen?: number;
  private regex?: RegExp;

  /**
   * Validates that the input is a string and meets all configured constraints
   * @param value The value to validate
   * @returns ValidationResult with the string or error messages
   */
  validate(value: unknown): ValidationResult<string> {
    if (typeof value !== 'string') {
      return {
        success: false,
        errors: [this.customMessage || 'Expected string']
      };
    }

    const errors: string[] = [];

    if (this.minLen !== undefined && value.length < this.minLen) {
      errors.push(`String must be at least ${this.minLen} characters long`);
    }

    if (this.maxLen !== undefined && value.length > this.maxLen) {
      errors.push(`String must be at most ${this.maxLen} characters long`);
    }

    if (this.regex && !this.regex.test(value)) {
      errors.push(this.customMessage || 'String does not match required pattern');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: value };
  }

  /**
   * Sets minimum length constraint
   * @param length Minimum number of characters required
   * @returns This validator for method chaining
   */
  minLength(length: number): StringValidator {
    this.minLen = length;
    return this;
  }

  /**
   * Sets maximum length constraint
   * @param length Maximum number of characters allowed
   * @returns This validator for method chaining
   */
  maxLength(length: number): StringValidator {
    this.maxLen = length;
    return this;
  }

  /**
   * Sets a regular expression pattern that the string must match
   * @param regex Regular expression pattern to test against
   * @returns This validator for method chaining
   * 
   * @example
   * ```typescript
   * // Phone number validation
   * const phoneValidator = Schema.string().pattern(/^\+?[\d\s-()]+$/);
   * 
   * // URL validation
   * const urlValidator = Schema.string().pattern(/^https?:\/\/.+/);
   * ```
   */
  pattern(regex: RegExp): StringValidator {
    this.regex = regex;
    return this;
  }

  optional(): OptionalValidator<string> {
    return new OptionalValidator(this);
  }

  withMessage(message: string): StringValidator {
    this.customMessage = message;
    return this;
  }
}

/**
 * Number validator with support for minimum and maximum value constraints
 * 
 * @example
 * ```typescript
 * // Age validation
 * const ageValidator = Schema.number().min(0).max(150);
 * 
 * // Price validation
 * const priceValidator = Schema.number()
 *   .min(0)
 *   .withMessage('Price must be a positive number');
 * 
 * // Percentage validation
 * const percentageValidator = Schema.number().min(0).max(100);
 * ```
 */
class NumberValidator implements Validator<number> {
  private customMessage?: string;
  private minVal?: number;
  private maxVal?: number;

  /**
   * Validates that the input is a number and meets all configured constraints
   * @param value The value to validate
   * @returns ValidationResult with the number or error messages
   */
  validate(value: unknown): ValidationResult<number> {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        success: false,
        errors: [this.customMessage || 'Expected number']
      };
    }

    const errors: string[] = [];

    if (this.minVal !== undefined && value < this.minVal) {
      errors.push(`Number must be at least ${this.minVal}`);
    }

    if (this.maxVal !== undefined && value > this.maxVal) {
      errors.push(`Number must be at most ${this.maxVal}`);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: value };
  }

  /**
   * Sets minimum value constraint
   * @param value Minimum value allowed
   * @returns This validator for method chaining
   */
  min(value: number): NumberValidator {
    this.minVal = value;
    return this;
  }

  /**
   * Sets maximum value constraint
   * @param value Maximum value allowed
   * @returns This validator for method chaining
   */
  max(value: number): NumberValidator {
    this.maxVal = value;
    return this;
  }

  optional(): OptionalValidator<number> {
    return new OptionalValidator(this);
  }

  withMessage(message: string): NumberValidator {
    this.customMessage = message;
    return this;
  }
}

/**
 * Boolean validator for strict boolean type checking
 * 
 * @example
 * ```typescript
 * const isActiveValidator = Schema.boolean();
 * 
 * isActiveValidator.validate(true);     // { success: true, data: true }
 * isActiveValidator.validate(false);    // { success: true, data: false }
 * isActiveValidator.validate("true");   // { success: false, errors: [...] }
 * isActiveValidator.validate(1);        // { success: false, errors: [...] }
 * ```
 */
class BooleanValidator implements Validator<boolean> {
  private customMessage?: string;

  /**
   * Validates that the input is a strict boolean value
   * @param value The value to validate
   * @returns ValidationResult with the boolean or error messages
   */
  validate(value: unknown): ValidationResult<boolean> {
    if (typeof value !== 'boolean') {
      return {
        success: false,
        errors: [this.customMessage || 'Expected boolean']
      };
    }

    return { success: true, data: value };
  }

  optional(): OptionalValidator<boolean> {
    return new OptionalValidator(this);
  }

  withMessage(message: string): BooleanValidator {
    this.customMessage = message;
    return this;
  }
}

/**
 * Date validator that accepts Date objects, valid date strings, and timestamps
 * 
 * @example
 * ```typescript
 * const birthDateValidator = Schema.date();
 * 
 * birthDateValidator.validate(new Date());           // Valid
 * birthDateValidator.validate("2023-01-01");         // Valid
 * birthDateValidator.validate(1672531200000);        // Valid (timestamp)
 * birthDateValidator.validate("invalid-date");       // Invalid
 * birthDateValidator.validate("not a date");         // Invalid
 * ```
 */
class DateValidator implements Validator<Date> {
  private customMessage?: string;

  /**
   * Validates that the input can be converted to a valid Date
   * @param value The value to validate (Date, string, or number)
   * @returns ValidationResult with the Date object or error messages
   */
  validate(value: unknown): ValidationResult<Date> {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return {
        success: false,
        errors: [this.customMessage || 'Expected date']
      };
    }

    if (isNaN(date.getTime())) {
      return {
        success: false,
        errors: [this.customMessage || 'Invalid date']
      };
    }

    return { success: true, data: date };
  }

  optional(): OptionalValidator<Date> {
    return new OptionalValidator(this);
  }

  withMessage(message: string): DateValidator {
    this.customMessage = message;
    return this;
  }
}

/**
 * Object validator for validating complex objects with defined schemas
 * 
 * @template T The type of object being validated
 * 
 * @example
 * ```typescript
 * // User profile validation
 * interface UserProfile {
 *   name: string;
 *   email: string;
 *   age?: number;
 * }
 * 
 * const userProfileValidator = Schema.object<UserProfile>({
 *   name: Schema.string().minLength(1),
 *   email: Schema.string().pattern(/^[^@]+@[^@]+$/),
 *   age: Schema.number().min(13).optional()
 * });
 * 
 * // API response validation
 * const apiResponseValidator = Schema.object({
 *   success: Schema.boolean(),
 *   data: Schema.object({
 *     id: Schema.string(),
 *     items: Schema.array(Schema.string())
 *   }),
 *   timestamp: Schema.date()
 * });
 * ```
 */
class ObjectValidator<T extends Record<string, any>> implements Validator<T> {
  private customMessage?: string;

  /**
   * Creates an object validator with the specified schema
   * @param schema Object defining validators for each property
   */
  constructor(private schema: Record<string, Validator<any>>) {}

  /**
   * Validates that the input is an object matching the defined schema
   * @param value The value to validate
   * @returns ValidationResult with the validated object or error messages
   */
  validate(value: unknown): ValidationResult<T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {
        success: false,
        errors: [this.customMessage || 'Expected object']
      };
    }

    const obj = value as Record<string, unknown>;
    const result: Record<string, any> = {};
    const errors: string[] = [];

    for (const [key, validator] of Object.entries(this.schema)) {
      const fieldResult = validator.validate(obj[key]);
      
      if (fieldResult.success) {
        if (fieldResult.data !== undefined) {
          result[key] = fieldResult.data;
        }
      }
      
      if (!fieldResult.success) {
        const failedResult = fieldResult as { success: false; errors: string[] };
        errors.push(...failedResult.errors.map(err => `${key}: ${err}`));
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: result as T };
  }

  optional(): OptionalValidator<T> {
    return new OptionalValidator(this);
  }

  withMessage(message: string): ObjectValidator<T> {
    this.customMessage = message;
    return this;
  }
}

/**
 * Array validator for validating arrays where all items match a specific validator
 * 
 * @template T The type of items in the array
 * 
 * @example
 * ```typescript
 * // Array of strings
 * const tagsValidator = Schema.array(Schema.string().minLength(1));
 * 
 * // Array of numbers
 * const scoresValidator = Schema.array(Schema.number().min(0).max(100));
 * 
 * // Array of objects
 * const usersValidator = Schema.array(Schema.object({
 *   id: Schema.string(),
 *   name: Schema.string(),
 *   active: Schema.boolean()
 * }));
 * 
 * // Nested arrays
 * const matrixValidator = Schema.array(Schema.array(Schema.number()));
 * ```
 */
class ArrayValidator<T> implements Validator<T[]> {
  private customMessage?: string;

  /**
   * Creates an array validator with the specified item validator
   * @param itemValidator Validator to apply to each array item
   */
  constructor(private itemValidator: Validator<T>) {}

  /**
   * Validates that the input is an array and all items match the item validator
   * @param value The value to validate
   * @returns ValidationResult with the validated array or error messages
   */
  validate(value: unknown): ValidationResult<T[]> {
    if (!Array.isArray(value)) {
      return {
        success: false,
        errors: [this.customMessage || 'Expected array']
      };
    }

    const result: T[] = [];
    const errors: string[] = [];

    for (let i = 0; i < value.length; i++) {
      const itemResult = this.itemValidator.validate(value[i]);
      
      if (itemResult.success) {
        result.push(itemResult.data);
      }
      
      if (!itemResult.success) {
        const failedResult = itemResult as { success: false; errors: string[] };
        errors.push(...failedResult.errors.map(err => `[${i}]: ${err}`));
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: result };
  }

  optional(): OptionalValidator<T[]> {
    return new OptionalValidator(this);
  }

  withMessage(message: string): ArrayValidator<T> {
    this.customMessage = message;
    return this;
  }
}

/**
 * Main Schema class providing factory methods for creating validators
 * 
 * @example
 * ```typescript
 * // Primitive validators
 * const stringValidator = Schema.string();
 * const numberValidator = Schema.number();
 * const booleanValidator = Schema.boolean();
 * const dateValidator = Schema.date();
 * 
 * // Complex validators
 * const objectValidator = Schema.object({
 *   name: Schema.string(),
 *   age: Schema.number()
 * });
 * const arrayValidator = Schema.array(Schema.string());
 * ```
 */
class Schema {
  /**
   * Creates a string validator
   * @returns A new StringValidator instance
   */
  static string(): StringValidator {
    return new StringValidator();
  }
  
  /**
   * Creates a number validator
   * @returns A new NumberValidator instance
   */
  static number(): NumberValidator {
    return new NumberValidator();
  }
  
  /**
   * Creates a boolean validator
   * @returns A new BooleanValidator instance
   */
  static boolean(): BooleanValidator {
    return new BooleanValidator();
  }
  
  /**
   * Creates a date validator
   * @returns A new DateValidator instance
   */
  static date(): DateValidator {
    return new DateValidator();
  }
  
  /**
   * Creates an object validator with the specified schema
   * @template T The type of object being validated
   * @param schema Object defining validators for each property
   * @returns A new ObjectValidator instance
   */
  static object<T extends Record<string, any>>(schema: Record<string, Validator<any>>): ObjectValidator<T> {
    return new ObjectValidator<T>(schema);
  }
  
  /**
   * Creates an array validator with the specified item validator
   * @template T The type of items in the array
   * @param itemValidator Validator to apply to each array item
   * @returns A new ArrayValidator instance
   */
  static array<T>(itemValidator: Validator<T>): ArrayValidator<T> {
    return new ArrayValidator<T>(itemValidator);
  }
}

// =================== USAGE EXAMPLES ===================

/**
 * Example type definitions for demonstration
 */
interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  isActive: boolean;
  tags: string[];
  address?: Address;
  metadata?: Record<string, any>;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  tags: string[];
  metadata?: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
}

/**
 * Collection of practical validation examples
 */
function demonstrateValidationExamples(): void {
  console.log('📚 Comprehensive Validation Examples\n');

  // === INITIAL COMPLEX EXAMPLE ===
  console.log('🚀 Initial Complex Schema Example:');
  
  // Define a complex schema
  const addressSchema = Schema.object({
    street: Schema.string(),
    city: Schema.string(),
    postalCode: Schema.string().pattern(/^\d{5}$/).withMessage('Postal code must be 5 digits'),
    country: Schema.string()
  });

  const userSchema = Schema.object({
    id: Schema.string().withMessage('ID must be a string'),
    name: Schema.string().minLength(2).maxLength(50),
    email: Schema.string().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    age: Schema.number().optional(),
    isActive: Schema.boolean(),
    tags: Schema.array(Schema.string()),
    address: addressSchema.optional(),
    metadata: Schema.object({}).optional()
  });

  // Validate data
  const userData = {
    id: "12345",
    name: "John Doe",
    email: "john@example.com",
    isActive: true,
    tags: ["developer", "designer"],
    address: {
      street: "123 Main St",
      city: "Anytown",
      postalCode: "12345",
      country: "USA"
    }
  };

  const result = userSchema.validate(userData);
  console.log('✅ Complex user validation result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.success) {
    console.log('📊 Validated user data:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ Validation errors:', (result as { success: false; errors: string[] }).errors);
  }
  
  // Test with invalid data to show error handling
  const invalidUserData = {
    id: 123, // Invalid: should be string
    name: "J", // Invalid: too short
    email: "invalid-email", // Invalid: bad format
    isActive: "yes", // Invalid: should be boolean
    tags: ["developer", 123], // Invalid: array item should be string
    address: {
      street: "123 Main St",
      city: "Anytown",
      postalCode: "1234", // Invalid: should be 5 digits
      country: "USA"
    }
  };
  
  const invalidResult = userSchema.validate(invalidUserData);
  console.log('\n❌ Invalid user validation result:', invalidResult.success ? 'SUCCESS' : 'FAILED');
  if (!invalidResult.success) {
    console.log('🔍 Detailed validation errors:');
    (invalidResult as { success: false; errors: string[] }).errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));

  // === BASIC VALIDATORS ===
  console.log('🔤 String Validation Examples:');
  
  // Username validation
  const usernameValidator = Schema.string()
    .minLength(3)
    .maxLength(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters, letters, numbers, and underscores only');
  
  console.log('Username "john_doe":', usernameValidator.validate("john_doe"));
  console.log('Username "jo":', usernameValidator.validate("jo"));
  console.log('Username "invalid-name!":', usernameValidator.validate("invalid-name!"));

  // Email validation
  const emailValidator = Schema.string()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage('Please enter a valid email address');
  
  console.log('\n📧 Email Validation:');
  console.log('Email "user@example.com":', emailValidator.validate("user@example.com"));
  console.log('Email "invalid.email":', emailValidator.validate("invalid.email"));

  // === NUMBER VALIDATORS ===
  console.log('\n🔢 Number Validation Examples:');
  
  // Age validation
  const ageValidator = Schema.number().min(0).max(150).withMessage('Age must be between 0 and 150');
  console.log('Age 25:', ageValidator.validate(25));
  console.log('Age -5:', ageValidator.validate(-5));
  console.log('Age 200:', ageValidator.validate(200));

  // Price validation
  const priceValidator = Schema.number().min(0).withMessage('Price must be positive');
  console.log('\n💰 Price Validation:');
  console.log('Price 19.99:', priceValidator.validate(19.99));
  console.log('Price -10:', priceValidator.validate(-10));

  // === COMPLEX OBJECT VALIDATION ===
  console.log('\n🏢 Complex Object Validation:');
  
  // Product validation schema
  const productValidator = Schema.object<Product>({
    id: Schema.string().pattern(/^[A-Z]{2}\d{4}$/).withMessage('Product ID must be 2 letters + 4 digits (e.g., AB1234)'),
    name: Schema.string().minLength(1).maxLength(100),
    price: Schema.number().min(0),
    category: Schema.string().minLength(1),
    inStock: Schema.boolean(),
    tags: Schema.array(Schema.string().minLength(1)),
    metadata: Schema.object({
      weight: Schema.number().min(0).optional(),
      dimensions: Schema.object({
        length: Schema.number().min(0),
        width: Schema.number().min(0),
        height: Schema.number().min(0)
      }).optional()
    }).optional()
  });

  const validProduct = {
    id: "AB1234",
    name: "Wireless Headphones",
    price: 99.99,
    category: "Electronics",
    inStock: true,
    tags: ["audio", "wireless", "bluetooth"],
    metadata: {
      weight: 250,
      dimensions: {
        length: 20,
        width: 15,
        height: 8
      }
    }
  };

  const invalidProduct = {
    id: "invalid",
    name: "",
    price: -10,
    category: "",
    inStock: "yes",
    tags: ["audio", "", 123],
    metadata: {
      weight: -5
    }
  };

  console.log('Valid product:', JSON.stringify(productValidator.validate(validProduct), null, 2));
  console.log('\nInvalid product:', JSON.stringify(productValidator.validate(invalidProduct), null, 2));

  // === ARRAY VALIDATION ===
  console.log('\n📋 Array Validation Examples:');
  
  // Simple array validation
  const scoresValidator = Schema.array(Schema.number().min(0).max(100));
  console.log('Test scores [85, 92, 78]:', scoresValidator.validate([85, 92, 78]));
  console.log('Invalid scores [85, -10, 120]:', scoresValidator.validate([85, -10, 120]));

  // Array of objects validation
  const contactsValidator = Schema.array(Schema.object({
    name: Schema.string().minLength(1),
    email: Schema.string().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    phone: Schema.string().pattern(/^[\d\s-+()]+$/).optional()
  }));

  const validContacts = [
    { name: "John Doe", email: "john@example.com", phone: "+1-555-0123" },
    { name: "Jane Smith", email: "jane@example.com" }
  ];

  const invalidContacts = [
    { name: "", email: "invalid-email", phone: "abc" },
    { name: "Bob", email: "bob@example.com", phone: "+1-555-0456" }
  ];

  console.log('\nValid contacts:', JSON.stringify(contactsValidator.validate(validContacts), null, 2));
  console.log('\nInvalid contacts:', JSON.stringify(contactsValidator.validate(invalidContacts), null, 2));

  // === OPTIONAL FIELDS ===
  console.log('\n❓ Optional Field Examples:');
  
  const userValidator = Schema.object({
    name: Schema.string().minLength(1),
    email: Schema.string().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    age: Schema.number().min(13).optional(),
    bio: Schema.string().maxLength(500).optional()
  });

  console.log('User with optional fields:', userValidator.validate({
    name: "Alice",
    email: "alice@example.com",
    age: 28,
    bio: "Software developer"
  }));

  console.log('\nUser without optional fields:', userValidator.validate({
    name: "Bob",
    email: "bob@example.com"
  }));

  // === NESTED VALIDATION ===
  console.log('\n🪆 Nested Object Validation:');
  
  const companyValidator = Schema.object({
    name: Schema.string().minLength(1),
    employees: Schema.array(Schema.object({
      id: Schema.string(),
      name: Schema.string().minLength(1),
      department: Schema.string(),
      salary: Schema.number().min(0),
      address: Schema.object({
        street: Schema.string(),
        city: Schema.string(),
        zipCode: Schema.string().pattern(/^\d{5}$/)
      }).optional()
    })),
    headquarters: Schema.object({
      country: Schema.string(),
      city: Schema.string(),
      established: Schema.date()
    })
  });

  const companyData = {
    name: "Tech Corp",
    employees: [
      {
        id: "E001",
        name: "Alice Johnson",
        department: "Engineering",
        salary: 75000,
        address: {
          street: "123 Main St",
          city: "Springfield",
          zipCode: "12345"
        }
      },
      {
        id: "E002",
        name: "Bob Smith",
        department: "Marketing",
        salary: 65000
      }
    ],
    headquarters: {
      country: "USA",
      city: "San Francisco",
      established: new Date("2015-03-15")
    }
  };

  const companyResult = companyValidator.validate(companyData);
  console.log('Company validation result:', companyResult.success ? 'SUCCESS' : 'FAILED');
  if (!companyResult.success) {
    console.log('Validation failed with errors');
  }

  console.log('\n🎯 All validation examples completed!');
}

/**
 * Main demo function that shows comprehensive validation examples
 */
function runTypeScriptValidationDemo(): void {
  console.log('🔍 Type-Safe Validation System Demo (TypeScript)\n');

  // Run comprehensive examples
  demonstrateValidationExamples();

  console.log('\n' + '='.repeat(60));
  console.log('📖 QUICK REFERENCE GUIDE');
  console.log('='.repeat(60));
  
  console.log(`
🔤 String Validation:
   Schema.string()                    // Basic string
   .minLength(n)                      // Minimum length
   .maxLength(n)                      // Maximum length  
   .pattern(regex)                    // Pattern matching
   .withMessage("custom message")     // Custom error

🔢 Number Validation:
   Schema.number()                    // Basic number
   .min(n)                           // Minimum value
   .max(n)                           // Maximum value
   .withMessage("custom message")     // Custom error

✅ Boolean Validation:
   Schema.boolean()                   // Strict boolean check
   .withMessage("custom message")     // Custom error

📅 Date Validation:
   Schema.date()                      // Date/string/timestamp
   .withMessage("custom message")     // Custom error

🏢 Object Validation:
   Schema.object({                    // Object schema
     field1: Schema.string(),
     field2: Schema.number()
   })

📋 Array Validation:
   Schema.array(itemValidator)        // Array with item validation

❓ Optional Fields:
   anyValidator.optional()            // Makes field optional

🔗 Method Chaining:
   Schema.string()                    // All methods return the
     .minLength(3)                    // validator instance for
     .maxLength(20)                   // fluent chaining
     .pattern(/^[a-z]+$/)
     .withMessage("Letters only")
     .optional()
`);

  console.log('\n🎉 TypeScript Demo completed successfully!');
}

// Export the Schema class for TypeScript modules
export { Schema };

// Run the comprehensive demo when file is executed directly (CommonJS)
if (typeof module !== 'undefined' && typeof require !== 'undefined') {
    // This code will only run in Node.js environment, not in browsers
    try {
        // Check if this file is being run directly (not imported)
        if (require.main === module) {
            runTypeScriptValidationDemo();
        }
    } catch (e) {
        // Ignore errors in browser environment or when require is not available
    }
}