import home from '../data/pages/home.json';
import about from '../data/pages/about.json';
import newsletter from '../data/pages/newsletter.json';
import blog from '../data/pages/blog.json';
import contact from '../data/pages/contact.json';

export const langs = ['tr', 'en'] as const;
export type Lang = (typeof langs)[number];
export const langPaths = () => langs.map(lang => ({ params: { lang } }));
export const ui = {
  tr: {
    'magazine.readMore': 'Yazıyı oku', 'magazine.all': 'Tümü', 'magazine.minRead': 'dk okuma',
    'magazine.empty': 'Henüz yazı yok.', 'magazine.back': 'Tüm yazılara dön', 'magazine.by': 'Yazan',
    'footer.rights': 'Robert Kolej Business Society. Öğrenci kulübü.',
  },
  en: {
    'magazine.readMore': 'Read article', 'magazine.all': 'All', 'magazine.minRead': 'min read',
    'magazine.empty': 'No articles yet.', 'magazine.back': 'Back to all articles', 'magazine.by': 'By',
    'footer.rights': 'Robert College Business Society. A student club.',
  },
} as const;
export const t = (lang: Lang) => (key: keyof (typeof ui)['tr']) => ui[lang][key];
export const formatDate = (date: Date, lang: Lang) => date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul',
});
export const splitId = (id: string) => {
  const [lang, ...rest] = id.split('/');
  return { lang: lang as Lang, slug: rest.join('/') };
};
export const readingMinutes = (body = '') => Math.max(1, Math.round(body.split(/\s+/).length / 200));
export const navItems = (lang: Lang) => [
  ['', home[lang].title], ['about', about[lang].title], ['newsletter', newsletter[lang].title],
  ['blog', blog[lang].title], ['contact', contact[lang].title],
] as const;
