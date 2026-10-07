import { SchoolConfig, SchoolId } from '../types';
import { CLASSES_LIST } from './initialData';

export const SCHOOL_CONFIGS: Record<SchoolId, SchoolConfig> = {
  mts_manbaul_islam: {
    id: 'mts_manbaul_islam',
    name: 'MTs Manbaul Islam',
    shortName: 'MTs Manbaul Islam',
    fullName: 'Madrasah Tsanawiyah Manbaul Islam Kota Bogor',
    level: 'MTs',
    foundation: 'Yayasan Manbaul Islam',
    city: 'Kota Bogor',
    address: 'Jl. Manbaul Islam, Kota Bogor, Jawa Barat',
    tagline: 'Madrasah Hebat Bermartabat • Berakhlak Mulia & Berprestasi',
    classes: CLASSES_LIST,
    themeColor: 'emerald',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-400/40',
    badgeText: 'text-emerald-300',
    headerGradient: 'from-slate-900 via-indigo-950 to-slate-900'
  }
};

export const ALL_SCHOOLS: SchoolConfig[] = [
  SCHOOL_CONFIGS.mts_manbaul_islam
];
