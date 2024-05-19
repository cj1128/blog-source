const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      // 没有衬线，默认字体
      sans: ['Helvetica', ...defaultTheme.fontFamily.sans, 'PingFang SC', 'Microsoft YaHei', '微软雅黑'],
      // 有衬线，用于标题
      serif: ['Newsreader', ...defaultTheme.fontFamily.serif, 'PingFang SC', 'Microsoft YaHei', '微软雅黑'],
      mono: ['Roboto Mono'],
    },
    extend: {
      textColor: {
        main: 'rgb(var(--color-text-main) / <alpha-value>)',
      },
      backgroundColor: {
        main: 'rgb(var(--color-bg-main) / <alpha-value>)',
        muted: 'rgb(var(--color-bg-muted) / <alpha-value>)',
      },
      borderColor: {
        main: 'rgb(var(--color-border-main) / <alpha-value>)',
      },
      colors: {
        comp: {
          tip: {
            text: 'var(--color-comp-tip-text)',
            a: 'var(--color-comp-tip-a)',
          },
        },
      },
      typography: (theme) => {
        return {
          cj: {
            css: {
              '--tw-prose-body': theme('textColor.main / 100%'),
              '--tw-prose-headings': theme('textColor.main / 100%'),
              '--tw-prose-lead': theme('textColor.main / 100%'),
              '--tw-prose-links': theme('textColor.main / 100%'),
              '--tw-prose-bold': theme('textColor.main / 100%'),
              '--tw-prose-counters': theme('textColor.main / 100%'),
              '--tw-prose-bullets': theme('textColor.main / 100%'),
              '--tw-prose-hr': theme('borderColor.main / 100%'),
              '--tw-prose-quotes': theme('textColor.main / 100%'),
              '--tw-prose-quote-borders': theme('borderColor.main / 100%'),
              '--tw-prose-captions': theme('textColor.main / 100%'),
              '--tw-prose-code': theme('textColor.main / 100%'),
              '--tw-prose-pre-code': theme('colors.zinc.100'),
              '--tw-prose-pre-bg': theme('colors.zinc.800'),
              '--tw-prose-th-borders': theme('borderColor.main / 100%'),
              '--tw-prose-td-borders': theme('borderColor.main / 100%'),
            },
          },
          DEFAULT: {
            css: {
              a: {
                fontWeight: 'normal',
                textDecoration: 'underline',
                textDecorationStyle: 'dashed',
                textDecorationThickness: '1px',
                textUnderlineOffset: '2px',
                '&:hover': {
                  textDecorationStyle: 'solid',
                },
              },
              'h1,h2,h3,h4,h5,h6': {
                fontFamily: theme('fontFamily.serif').join(', '),
                marginTop: 0,
                fontWeight: 500,
              },
              blockquote: {
                fontFamily: theme('fontFamily.mono').join(', '),
                fontStyle: 'italic',
                fontWeight: 'normal',
                lineHeight: 1.4,
                paddingLeft: '2em',
                border: 0,
                borderLeft: 'solid 2px',
                borderColor: theme('colors.stone.300'),
                //   '@media (min-width: theme("screens.sm"))': {
                //     fontSize: '1.66667em',
                //     lineHeight: 1.3,
                //   },
              },
              pre: {
                whiteSpace: 'pre-wrap',
              },
            },
          },
          lg: {
            css: {
              blockquote: {
                //   paddingLeft: 0,
              },
            },
          },
        }
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
