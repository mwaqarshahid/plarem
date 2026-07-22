import { CategoryId } from '@types';
import { BRAND } from './brand';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}

/** Category accents drawn from the brand palette (arrow / ink / lime / tile). */
export const CATEGORIES: CategoryMeta[] = [
  { id: 'shopping', label: 'Shopping', icon: 'cart-outline', color: BRAND.arrow },
  { id: 'personal', label: 'Personal', icon: 'account-outline', color: '#6E8496' },
  { id: 'office', label: 'Office', icon: 'briefcase-outline', color: BRAND.tileDark },
  { id: 'health', label: 'Health', icon: 'heart-pulse', color: '#C94B5A' },
  { id: 'travel', label: 'Travel', icon: 'airplane', color: '#3AA8D8' },
  { id: 'bills', label: 'Bills', icon: 'file-document-outline', color: BRAND.tileLight },
  { id: 'friends', label: 'Friends', icon: 'account-group-outline', color: '#8FA81A' },
  { id: 'family', label: 'Family', icon: 'home-heart', color: '#B8A014' },
  { id: 'custom', label: 'Custom', icon: 'tag-outline', color: '#6B7280' },
];

export const getCategoryMeta = (id: CategoryId): CategoryMeta =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
