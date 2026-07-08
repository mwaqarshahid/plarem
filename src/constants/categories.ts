import { CategoryId } from '@types';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'shopping', label: 'Shopping', icon: 'cart-outline', color: '#4F5BE8' },
  { id: 'personal', label: 'Personal', icon: 'account-outline', color: '#00A98F' },
  { id: 'office', label: 'Office', icon: 'briefcase-outline', color: '#E8930C' },
  { id: 'health', label: 'Health', icon: 'heart-pulse', color: '#DC3A45' },
  { id: 'travel', label: 'Travel', icon: 'airplane', color: '#0E9FD8' },
  { id: 'bills', label: 'Bills', icon: 'file-document-outline', color: '#8E44AD' },
  { id: 'friends', label: 'Friends', icon: 'account-group-outline', color: '#1F9D5B' },
  { id: 'family', label: 'Family', icon: 'home-heart', color: '#E85B8A' },
  { id: 'custom', label: 'Custom', icon: 'tag-outline', color: '#5C6070' },
];

export const getCategoryMeta = (id: CategoryId): CategoryMeta =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
