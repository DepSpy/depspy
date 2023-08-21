const fetchPackageNames = async (name: string): Promise<Array<{ name: string; description: string; version: string }>> => {
  try {
    const response = await fetch(`https://api.npms.io/v2/search/suggestions?q=${name}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const searchResults = data.slice(0, 10).map((result) => ({
      name: result.package.name,
      version: result.package.version,
      description: result.package.description,
    }));
    return searchResults;
  } catch (error) {
    console.error('Error fetching package names:', error);
    return [];
  }
};

export default fetchPackageNames;