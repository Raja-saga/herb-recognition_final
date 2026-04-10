export const loadHerbMetadata = async (herbName) => {
  if (!herbName) return null;

  try {
    const fileName = herbName.replace(/ /g, '_');
    const response = await fetch(`/metadata/${fileName}.json`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Validate that loaded data matches requested herb
    if (data.herb && data.herb !== herbName && data.herb !== fileName) {
      console.warn(`Herb mismatch: requested ${herbName}, got ${data.herb}`);
    }
    
    return data.locations || [];
  } catch (error) {
    console.error('Failed to load herb metadata:', error);
    return null;
  }
};
