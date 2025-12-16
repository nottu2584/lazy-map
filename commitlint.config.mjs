// Commitlint configuration for conventional commits
// Docs: https://commitlint.js.org/

export default {
  extends: ['@commitlint/config-conventional'],

  // Custom rules for your monorepo
  rules: {
    // Type enum matching your conventions.m
    // d
    'type-enum': [
      2,
      'always',
      [
        'feat',      // New feature
        'fix',       // Bug fix
        'refactor',  // Code restructuring
        'docs',      // Documentation
        'test',      // Tests
        'chore',     // Maintenance
        'style',     // Code style (formatting, etc)
        'perf',      // Performance improvements
        'ci',        // CI/CD changes
        'build',     // Build system changes
        'revert',    // Revert previous commit
      ],
    ],

    // Scope enum matching your monorepo structure
    'scope-enum': [
      1, // warning, not error
      'always',
      [
        'application',    // Application layer
        'backend',        // Backend app
        'ci',             // CI/CD
        'deps',           // Dependency updates
        'docs',           // Documentation
        'domain',         // Domain layer
        'frontend',       // Frontend app
        'infrastructure', // Infrastructure layer
        'release',        // Release-related
        'security',       // Security fixes
      ],
    ],

    // Subject should not end with period
    'subject-full-stop': [2, 'never', '.'],

    // Subject should start lowercase, but may contain capitals (Discord, OAuth, JWT, API, etc.)
    // We disable the case rule since commitlint doesn't support "lowercase start with capitals inside"
    'subject-case': [0],

    // Allow leading emojis in subject
    'subject-empty': [2, 'never'],

    // Header (type + scope + subject) max length
    'header-max-length': [2, 'always', 100],

    // Disable body line length check (URLs and links can be long)
    'body-max-line-length': [0, 'always', Infinity],
  },
};
