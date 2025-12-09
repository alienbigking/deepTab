module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended', // ESLint 基础规则
        'plugin:react/recommended', // React 推荐规则
        'plugin:react-hooks/recommended', // React Hooks 规则
        'plugin:@typescript-eslint/recommended', // TypeScript 推荐规则
        'prettier', // 关闭与 Prettier 冲突的 ESLint 规则
        'plugin:prettier/recommended', // 启用 Prettier 作为 ESLint 规则
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    plugins: ['react', '@typescript-eslint', 'prettier'],
    rules: {
        // 自定义 ESLint 规则
        'prettier/prettier': ['error', { semi: false }], // 不使用分号
        'react/react-in-jsx-scope': 'off', // React 17+ 不需要显式引入 React
        "react/prop-types": "off",
        '@typescript-eslint/explicit-module-boundary-types': 'off', // 关闭类型导出要求
        '@typescript-eslint/no-explicit-any': 'warn', // 避免使用 any 类型
    },
    settings: {
        react: {
            version: 'detect', // 自动检测 React 版本
        },
    },
}
