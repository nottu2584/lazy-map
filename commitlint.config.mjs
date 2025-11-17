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
        'deps',           // Dependency updates
        'backend',        // Backend app
        'frontend',       // Frontend app
        'application',    // Application layer
        'domain',         // Domain layer
        'infrastructure', // Infrastructure layer
        'ci',            // CI/CD
        'release',       // Release-related
      ],
    ],

    // Subject should not end with period
    'subject-full-stop': [2, 'never', '.'],

    // Subject should be lowercase
    'subject-case': [2, 'always', 'lower-case'],

    // Header (type + scope + subject) max length
    'header-max-length': [2, 'always', 100],

    // Disable body line length check (URLs and links can be long)
    'body-max-line-length': [0, 'always', Infinity],
  },
};
