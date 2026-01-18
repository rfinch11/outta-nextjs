import {
  LuBook,
  LuTrees,
  LuTent,
  LuLandmark,
  LuTheater,
  LuFerrisWheel,
  LuPalette,
  LuShoppingBag,
  LuBlocks,
  LuBuilding,
  LuApple,
} from 'react-icons/lu';
import { MdOutlineSportsHandball } from 'react-icons/md';
import { PiPark } from 'react-icons/pi';
import { TbBounceRight } from 'react-icons/tb';
import { IconType } from 'react-icons';

/**
 * Maps place types to appropriate icons
 */
export function getPlaceTypeIcon(placeType: string | null | undefined): IconType {
  if (!placeType) return LuBuilding;

  const type = placeType.toLowerCase();

  switch (type) {
    case 'library':
      return LuBook;
    case 'park':
      return LuTrees;
    case 'camp':
      return LuTent;
    case 'museum':
      return LuLandmark;
    case 'recreation center':
      return MdOutlineSportsHandball;
    case 'playground':
      return PiPark;
    case 'theater':
      return LuTheater;
    case 'indoor play':
      return TbBounceRight;
    case 'attraction':
      return LuFerrisWheel;
    case 'art':
      return LuPalette;
    case 'book store':
      return LuShoppingBag;
    case 'toys':
      return LuBlocks;
    case 'farmers market':
      return LuApple;
    default:
      return LuBuilding;
  }
}
