import { promises as fs } from 'fs';
import path from 'path';

interface Tag {
  id: string;
  name: {
    en: string;
    'zh-tw': string;
  };
}

interface KaomojiItem {
  id: string;
  text: string;
  tags: string[];
}

interface CategoryData {
  id: string;
  name: string;
  items: KaomojiItem[];
  lastUpdated: string;
}

interface IndexData {
  categories: { id: string; name: { en: string; 'zh-tw': string } }[];
  tags: Tag[];
  totalItems: number;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CATEGORIES_DIR = path.join(DATA_DIR, 'categories');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

async function runMigration() {
  try {
    const indexContent = await fs.readFile(INDEX_FILE, 'utf-8');
    const indexData: IndexData = JSON.parse(indexContent);

    const tagMap = new Map<string, string>();
    indexData.tags.forEach((tag) => {
      tagMap.set(tag.name['zh-tw'], tag.id);
    });
    tagMap.set('ぞくぞく', 'shiver');

    console.log(`Built tag map with ${tagMap.size} entries.`);

    for (const category of indexData.categories) {
      const categoryFilePath = path.join(CATEGORIES_DIR, `${category.id}.json`);
      try {
        const categoryContent = await fs.readFile(categoryFilePath, 'utf-8');
        const categoryData: CategoryData = JSON.parse(categoryContent);
        let fileModified = false;

        if (categoryData.items) {
          categoryData.items.forEach((item) => {
            const originalTags = [...item.tags];
            const newTags = item.tags
              .map((oldTag) => tagMap.get(oldTag) || oldTag)
              .filter((value, index, self) => self.indexOf(value) === index);

            if (JSON.stringify(originalTags.sort()) !== JSON.stringify(newTags.sort())) {
              item.tags = newTags.sort();
              fileModified = true;
            }
          });
        }

        if (fileModified) {
          await fs.writeFile(categoryFilePath, JSON.stringify(categoryData, null, 2), 'utf-8');
          console.log(`Updated tags in: ${category.id}.json`);
        }
      } catch (err) {
        console.error(`Error processing file ${category.id}.json:`, err);
      }
    }
  } catch (err) {
    console.error('Failed to run tag migration:', err);
  }
}

runMigration();
