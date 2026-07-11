const NAME_MAP: Record<string, string> = {
  'ankur1997': 'Ankur',
  'Knight@09': 'Sam',
  'abhinav7': 'Abhinav',
  'Harith Gowda': 'Harith',
  'Subhinav': 'Subhinav',
  'Pwn007': 'Pawan',
  'DEEDU': 'Alok',
  'DJ Saket': 'Saket',
  'MoriartyKD': 'Kislay',
  'tintin0007': 'Yatin',
  'Anne11': 'Ananya',
  'Killfreak': 'Sushant',
  'AnX007': 'Ankit',
  'Jmrj': 'Jishnu',
  'm02dd': 'Ashish',
  'calcrohit': 'Rohit',
  'OGGareeb': 'Akhil',
  'sbjwinner': 'Sanjana',
  'Manseyyyy': 'Mansi',
  'f51-dd': 'Shiva',
  'BluffMaster2301': 'Kshitij',
  'KS@cypher': 'Kavish',
  'Uchiha Aman': 'Aman',
  'Ghost@KS': 'Kavish',
  'D.J Saket': 'Saket',
  'FT_SSS': 'FT_SSS',
};

export function displayName(name: string): string {
  return NAME_MAP[name] ?? name;
}
