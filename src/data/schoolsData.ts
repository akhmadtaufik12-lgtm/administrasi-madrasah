import { SchoolConfig, SchoolId } from '../types';
import { CLASSES_LIST } from './initialData';

export const SCHOOL_CONFIGS: Record<SchoolId, SchoolConfig> = {
  mts_manbaul_islam: {
    id: 'mts_manbaul_islam',
    name: 'Madrasah',
    shortName: 'Madrasah',
    fullName: 'Madrasah Tsanawiyah',
    level: 'MTs',
    foundation: 'Yayasan Pendidikan Islam',
    city: 'Kota',
    address: 'Jl. Pendidikan Madrasah',
    tagline: 'Madrasah Hebat Bermartabat • Berakhlak Mulia & Berprestasi',
    classes: CLASSES_LIST,
    themeColor: 'emerald',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-400/40',
    badgeText: 'text-emerald-300',
    headerGradient: 'from-[#063016] via-[#0b4822] to-[#15803d]'
  }
};

export const ALL_SCHOOLS: SchoolConfig[] = [
  SCHOOL_CONFIGS.mts_manbaul_islam
];
