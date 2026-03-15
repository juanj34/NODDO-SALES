import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales, pathnames } from './config';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales, pathnames });
