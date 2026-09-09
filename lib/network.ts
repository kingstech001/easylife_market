export type NetworkProfile = {
  effectiveType?: string;
  saveData: boolean;
  downlink: number;
  isSlow: boolean;
  isOffline: boolean;
};

export function getNetworkProfile(): NetworkProfile {
  if (typeof navigator === "undefined") {
    return {
      effectiveType: undefined,
      saveData: false,
      downlink: 0,
      isSlow: false,
      isOffline: false,
    };
  }

  const connection =
    (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
      mozConnection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
      msConnection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
    }).connection ||
    (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
      mozConnection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
      msConnection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
    }).mozConnection ||
    (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
      mozConnection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
      msConnection?: {
        effectiveType?: string;
        saveData?: boolean;
        downlink?: number;
      };
    }).msConnection;

  const effectiveType = connection?.effectiveType ?? "unknown";
  const saveData = Boolean(connection?.saveData);
  const downlink = Number(connection?.downlink ?? 0);
  const isSlow =
    saveData ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    (downlink > 0 && downlink < 1.5);

  return {
    effectiveType,
    saveData,
    downlink,
    isSlow,
    isOffline: !navigator.onLine,
  };
}

export function isSlowNetwork(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const profile = getNetworkProfile();
  return profile.isSlow || profile.isOffline;
}
