import {
  LuSchool,
  LuFerrisWheel,
  LuPalette,
  LuBook,
  LuBaby,
  LuLandmark,
  LuUsers,
  LuBuilding2,
  LuGraduationCap,
  LuDoorOpen,
  LuFlower2,
  LuDumbbell,
  LuMapPin,
  LuCircleDot,
  LuSparkles,
  LuFlag,
  LuTrees,
  LuTheater,
  LuBinoculars,
  LuShoppingBag,
  LuInfo,
  LuBuilding,
} from 'react-icons/lu';
import { IconType } from 'react-icons';

/**
 * Maps place types to appropriate Lucide icons
 */
export function getPlaceTypeIcon(placeType: string | null | undefined): IconType {
  if (!placeType) return LuBuilding;

  const type = placeType.toLowerCase();

  // Educational & Children
  if (type.includes('school') || type.includes('after school')) return LuSchool;
  if (type.includes('museum') || type.includes("children's museum")) return LuLandmark;
  if (type.includes('library')) return LuBook;
  if (type.includes('education center')) return LuGraduationCap;
  if (type.includes('day care') || type.includes('daycare')) return LuBaby;

  // Entertainment & Play
  if (type.includes('amusement park')) return LuFerrisWheel;
  if (type.includes('amusement center') || type.includes('indoor playground')) return LuCircleDot;
  if (type.includes('playground')) return LuSparkles;
  if (type.includes('escape room')) return LuDoorOpen;
  if (type.includes('miniature golf')) return LuFlag;

  // Arts & Culture
  if (type.includes('art gallery') || type.includes('painting studio')) return LuPalette;
  if (type.includes('theater') || type.includes('theatre')) return LuTheater;

  // Recreation & Fitness
  if (type.includes('gymnastics')) return LuDumbbell;
  if (type.includes('recreation center')) return LuUsers;

  // Outdoor & Nature
  if (type.includes('park') && !type.includes('amusement')) return LuTrees;
  if (type.includes('garden')) return LuFlower2;
  if (type.includes('historical landmark') || type.includes('landmark')) return LuMapPin;

  // Shopping & Retail
  if (type.includes('toy store') || type.includes('book store')) return LuShoppingBag;

  // Tourism & Information
  if (type.includes('tourist attraction')) return LuBinoculars;
  if (type.includes('visitor center')) return LuInfo;

  // Community & Organizations
  if (type.includes('community center')) return LuUsers;
  if (type.includes('convention center')) return LuBuilding2;
  if (type.includes('non-profit')) return LuUsers;

  // Default fallback
  return LuBuilding;
}
