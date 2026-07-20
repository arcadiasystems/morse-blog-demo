export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (!address) return "";
  if (address.length <= head + tail + 2) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

const SUI_ADDRESS_RE = /^0x[0-9a-fA-F]{1,64}$/;

export function isValidSuiAddress(value: string): boolean {
  return SUI_ADDRESS_RE.test(value.trim());
}
