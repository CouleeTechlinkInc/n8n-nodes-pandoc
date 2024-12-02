module.exports = {
	root: true,
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json'],
		sourceType: 'module',
		ecmaVersion: 2020,
		tsconfigRootDir: __dirname,
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended'
	],
	ignorePatterns: ['node_modules/', 'dist/'],
	overrides: [
		{
			files: ['*.ts'],
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
			}
		}
	]
}; 