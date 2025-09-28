'use client';

import type { KaomojiItem } from '@/types/Kaomoji';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import KaomojiBtn from '@/components/atoms/KaomojiBtn';

interface KaomojiListProps {
  kaomojis: KaomojiItem[];
}

const KaomojiList: React.FC<KaomojiListProps> = ({ kaomojis }) => {
  const { copiedId, copyToClipboard } = useCopyToClipboard();

  return (
    <ul role="list" className="flex-center flex-wrap gap-2 md:gap-3 -mx-4 sm:mx-0">
      {kaomojis.map((kaomoji) => (
        <li key={kaomoji.id}>
          <KaomojiBtn
            text={kaomoji.text}
            onCopy={() => copyToClipboard(kaomoji.text, kaomoji.id)}
            isCopied={copiedId === kaomoji.id}
          />
        </li>
      ))}
    </ul>
  );
};

export default KaomojiList;
