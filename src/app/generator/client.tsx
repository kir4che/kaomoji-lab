'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

// import { useId, useState } from 'react';
// import SpinnerIcon from '@/assets/icons/spinner.svg';
// import Input from '@/components/atoms/Input';
// import KaomojiBtn from '@/components/atoms/KaomojiBtn';
// import { useToast } from '@/contexts/ToastContext';
// import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

// interface GeneratorFormProps {
//   prompt: string;
//   onChange: (value: string) => void;
//   onGenerate: () => void;
//   isLoading: boolean;
// }

// const GeneratorForm: React.FC<GeneratorFormProps> = ({
//   prompt,
//   onChange,
//   onGenerate,
//   isLoading,
// }) => {
//   const inputId = useId();
//   const { lang } = useLanguage();

//   return (
//     <form
//       className="flex flex-col gap-y-4 md:gap-y-6 mx-auto w-full p-6 md:px-8 max-w-screen-sm rounded-2xl bg-white shadow-lg"
//       onSubmit={(e) => {
//         e.preventDefault();
//         onGenerate();
//       }}
//     >
//       <label htmlFor={inputId} className="sr-only">
//         {t('generatorPromptLabel', lang)}
//       </label>
//       <Input
//         value={prompt}
//         maxLength={100}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={t('generatorPromptPlaceholder', lang)}
//         className="rounded-lg py-3.5 text-lg"
//         focusEffect
//         helperText={t('generatorHelperText', lang)}
//       />
//       <button
//         type="submit"
//         disabled={isLoading}
//         aria-busy={isLoading}
//         aria-disabled={isLoading}
//         className="mx-auto flex w-fit items-center justify-center rounded-full bg-primary-500 px-20 py-3 font-semibold text-white transition-all duration-300 hover:bg-primary-600"
//       >
//         {isLoading ? (
//           <>
//             <SpinnerIcon className="mr-2 size-5 animate-spin" />
//             {t('generating', lang)}
//           </>
//         ) : (
//           t('generate', lang)
//         )}
//       </button>
//     </form>
//   );
// };

// const GeneratorPageWithFeature: React.FC = () => {
//   const { lang } = useLanguage();
//   const { showToast } = useToast();
//   const { copiedId, copyToClipboard } = useCopyToClipboard();

//   const [prompt, setPrompt] = useState<string>('');
//   const [kaomojis, setKaomojis] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   const inspirationPrompts = [
//     t('inspirationDancing', lang),
//     t('inspirationPeekingCat', lang),
//     t('inspirationSparklingEyes', lang),
//     t('inspirationTired', lang),
//     t('inspirationFlyingKiss', lang),
//     t('inspirationSurprised', lang),
//   ];

//   const handleGenerate = async (currPrompt?: string) => {
//     const finalPrompt = (currPrompt ?? prompt).trim();
//     if (!finalPrompt) {
//       showToast(t('generatorPromptError', lang), 'error');
//       return;
//     }

//     setIsLoading(true);
//     setKaomojis([]);

//     try {
//       const res = await fetch('/api/generate', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userPrompt: finalPrompt }),
//       });

//       if (!res.ok) {
//         const errData = await res.json();
//         if (errData.status === 429) throw new Error(t('generatorRateLimitError', lang));
//         else throw new Error(t('generatorGenericError', lang));
//       }

//       const parsedKaomojis = await res.json();

//       if (
//         !Array.isArray(parsedKaomojis) ||
//         !parsedKaomojis.every((item) => typeof item === 'string')
//       )
//         throw new Error(t('generatorDataError', lang));

//       setKaomojis(parsedKaomojis);
//     } catch (err) {
//       const errMsg = err instanceof Error ? err.message : t('generatorGenericError', lang);
//       showToast(errMsg, 'error');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePromptClick = (selectedPrompt: string) => {
//     setPrompt(selectedPrompt);
//     handleGenerate(selectedPrompt);
//   };

//   return (
//     <div className="flex-1 flex flex-col px-4">
//       <section className="mb-4 md:mb-6 text-center space-y-4">
//         <h1>{t('generatorTitle', lang)}</h1>
//         <p className="text-sm text-gray-500">{t('generatorSubtitle', lang)}</p>
//       </section>
//       <GeneratorForm
//         prompt={prompt}
//         onChange={setPrompt}
//         onGenerate={() => handleGenerate()}
//         isLoading={isLoading}
//       />
//       {kaomojis.length > 0 && (
//         <section className="pt-10 space-y-6">
//           <h3 className="text-center text-2xl font-semibold">{t('yourKaomojis', lang)}</h3>
//           <div className="flex-center flex-wrap gap-4">
//             {kaomojis.map((kaomoji, idx) => {
//               const id = String(idx);
//               return (
//                 <KaomojiBtn
//                   key={id}
//                   text={kaomoji}
//                   onCopy={() => copyToClipboard(kaomoji, id)}
//                   isCopied={copiedId === id}
//                   className="text-lg"
//                 />
//               );
//             })}
//           </div>
//         </section>
//       )}
//       <section className="mt-4 py-4 md:pt-6 md:pb-8">
//         <h3 className="mb-4 text-center text-lg font-medium text-gray-800">
//           {t('noInspiration', lang)}
//         </h3>
//         <div className="flex-center flex-wrap">
//           {inspirationPrompts.map((item) => (
//             <button
//               key={item}
//               type="button"
//               onClick={() => handlePromptClick(item)}
//               disabled={isLoading}
//               className="rounded-full px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-primary-100/50 hover:text-primary-600 disabled:opacity-50"
//             >
//               {item}
//             </button>
//           ))}
//         </div>
//       </section>
//     </div>
//   );
// };

const GeneratorPage: React.FC = () => {
  const { lang } = useLanguage();

  return (
    <div className="flex-center flex-1 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-3xl font-bold text-gray-800">{t('comingSoonTitle', lang)}</h1>
        <p className="text-lg text-gray-600">{t('comingSoonDescription', lang)}</p>
      </div>
    </div>
  );
};

export default GeneratorPage;
