const fetchPackageNames = async () => {
  const { default: names } = await import("all-the-package-names");
  return names;
};

export default fetchPackageNames;
