/** Which side's loader colours to use: green (admin), blue (stylist) or the customer colour. */
export const loaderSide = (pathname: string) => {
  if (/^\/admin(\/|$)/.test(pathname)) return 'admin';
  // Not /stylists/..., which is the customer's public stylist page
  if (/^\/stylist(\/|$)/.test(pathname)) return 'stylist';
  return 'user';
};
