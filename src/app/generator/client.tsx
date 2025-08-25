'use client';

import { useState, useId } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import KaomojiBtn from '@/components/atoms/KaomojiBtn';
import Input from '@/components/atoms/Input';
import SpinnerIcon from '@/assets/icons/spinner.svg';

interface GeneratorFormProps {
  prompt: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const GeneratorForm: React.FC<GeneratorFormProps> = ({
  prompt,
  onChange,
  onGenerate,
  isLoading,
}) => {
  const inputId = useId();

  return (
    <form
      className="flex flex-col gap-y-4 md:gap-y-6 mx-auto w-full p-6 md:px-8 max-w-screen-sm rounded-2xl bg-white shadow-lg"
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        顏文字靈感輸入
      </label>
      <Input
        value={prompt}
        maxLength={100}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例如：閃亮飛舞的貓咪"
        className="rounded-lg py-3.5 text-lg"
        focusEffect
        helperText="最多可輸入 100 字，且每分鐘只能生成 1 次，暫請見諒。"
      />
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        aria-disabled={isLoading}
        className="mx-auto flex w-fit items-center justify-center rounded-full bg-primary-500 px-20 py-3 font-semibold text-white transition-all duration-300 hover:bg-primary-600"
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="mr-2 size-5 animate-spin" />
            生成中
          </>
        ) : (
          '立即生成'
        )}
      </button>
    </form>
  );
};

const inspirationPrompts = [
  '開心地跳舞',
  '偷偷觀察的小貓咪',
  '閃閃發亮的眼睛',
  '疲憊地趴在桌上',
  '送出一個飛吻',
  '驚訝到下巴掉下來',
];

const GeneratorPage: React.FC = () => {
  const { showToast } = useToast();
  const { copiedId, copyToClipboard } = useCopyToClipboard();

  const [prompt, setPrompt] = useState<string>('');
  const [kaomojis, setKaomojis] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerate = async (currPrompt?: string) => {
    const finalPrompt = (currPrompt ?? prompt).trim();
    if (!finalPrompt) {
      showToast('請輸入你的想法或選擇一個靈感！', 'error');
      return;
    }

    setIsLoading(true);
    setKaomojis([]);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: finalPrompt }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.status === 429) {
          throw new Error('目前 1 分鐘內只能請求 1 次，請稍後再試。');
        } else throw new Error('生成失敗，請稍後再試。');
      }

      const parsedKaomojis = await res.json();

      if (
        !Array.isArray(parsedKaomojis) ||
        !parsedKaomojis.every((item) => typeof item === 'string')
      )
        throw new Error('從伺服器收到的資料格式不正確！');

      setKaomojis(parsedKaomojis);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '生成失敗，請稍後再試。';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    handleGenerate(selectedPrompt);
  };

  return (
    <div className="flex-1 flex flex-col px-4">
      <section className="mb-4 md:mb-6 text-center space-y-4">
        <h1>
          <span className="text-primary-500">顏文字</span>產生器
        </h1>
        <p className="text-sm text-gray-500">輸入你的靈感，AI 將為你創造 3 個獨一無二的顏文字！</p>
      </section>
      <GeneratorForm
        prompt={prompt}
        onChange={setPrompt}
        onGenerate={() => handleGenerate()}
        isLoading={isLoading}
      />
      {kaomojis.length > 0 && (
        <section className="pt-10 space-y-6">
          <h3 className="text-center text-2xl font-semibold">✨ 屬於你的顏文字 ✨</h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {kaomojis.map((kaomoji, idx) => {
              const id = String(idx);
              return (
                <KaomojiBtn
                  key={id}
                  text={kaomoji}
                  onCopy={() => copyToClipboard(kaomoji, id)}
                  isCopied={copiedId === id}
                  className="text-lg"
                />
              );
            })}
          </div>
        </section>
      )}
      <section className="mt-4 py-4 md:pt-6 md:pb-8">
        <h3 className="mb-4 text-center text-lg font-medium text-gray-800">
          沒有靈感？試試看這些！
        </h3>
        <div className="flex-center flex-wrap">
          {inspirationPrompts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handlePromptClick(item)}
              disabled={isLoading}
              className="rounded-full px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-primary-100/50 hover:text-primary-600 disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GeneratorPage;
