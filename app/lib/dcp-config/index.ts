import { BundleType } from '../../constants/bundle';
import { PDP_DCP_CONFIG } from './pdp.config';
import { FPB_DCP_CONFIG } from './fpb.config';

export function getDCPConfig(bundleType: BundleType) {
  return bundleType === BundleType.FULL_PAGE ? FPB_DCP_CONFIG : PDP_DCP_CONFIG;
}

export type { DCPGroup, DCPSection, DCPSectionKey, DCPGroupKey } from './types';
