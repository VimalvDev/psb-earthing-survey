export const ALL_STATES = [
  { key: "Andhra Pradesh", label: "Andhra Pradesh" },
  { key: "Arunachal Pradesh", label: "Arunachal Pradesh" },
  { key: "Assam", label: "Assam" },
  { key: "Bihar", label: "Bihar" },
  { key: "Chandigarh", label: "Chandigarh" },
  { key: "Chhattisgarh", label: "Chhattisgarh" },
  { key: "Delhi", label: "Delhi" },
  { key: "Goa", label: "Goa" },
  { key: "Gujarat", label: "Gujarat" },
  { key: "Haryana", label: "Haryana" },
  { key: "Himachal Pradesh", label: "Himachal Pradesh" },
  { key: "Jammu and Kashmir", label: "Jammu and Kashmir" },
  { key: "Jharkhand", label: "Jharkhand" },
  { key: "Karnataka", label: "Karnataka" },
  { key: "Kerala", label: "Kerala" },
  { key: "Madhya Pradesh", label: "Madhya Pradesh" },
  { key: "Maharashtra", label: "Maharashtra" },
  { key: "Manipur", label: "Manipur" },
  { key: "Meghalaya", label: "Meghalaya" },
  { key: "Mizoram", label: "Mizoram" },
  { key: "Nagaland", label: "Nagaland" },
  { key: "Odisha", label: "Odisha" },
  { key: "Puducherry", label: "Puducherry" },
  { key: "Punjab", label: "Punjab" },
  { key: "Rajasthan", label: "Rajasthan" },
  { key: "Sikkim", label: "Sikkim" },
  { key: "Tamil Nadu", label: "Tamil Nadu" },
  { key: "Telangana", label: "Telangana" },
  { key: "Tripura", label: "Tripura" },
  { key: "Uttar Pradesh", label: "Uttar Pradesh" },
  { key: "Uttarakhand", label: "Uttarakhand" },
  { key: "West Bengal", label: "West Bengal" }
];

export const STATE_ALIASES: Record<string, string> = {
  "jammu kashmir": "Jammu and Kashmir",
  "jammu & kashmir": "Jammu and Kashmir",
  "vishakhapatnam (andhera pradesh)": "Andhra Pradesh",
  "agartala (tripura)": "Tripura",
  "shillong (meghalaya)": "Meghalaya",
  "ranchi (jharkhand)": "Jharkhand",
  "raipur (chattsgarsh)": "Chhattisgarh",
  "pondey cherry": "Puducherry",
  "patna (bihar)": "Bihar",
  "panji (goa)": "Goa",
  "mumbai": "Maharashtra",
  "ludhiyana (punjab)": "Punjab",
  "kolkata": "West Bengal",
  "kohima ( nagaland)": "Nagaland",
  "kochi (kerala)": "Kerala",
  "jaipur (rajasthan)": "Rajasthan",
  "itanagar": "Arunachal Pradesh",
  "hyderabad": "Telangana",
  "parwanoo (himachal pradesh)": "Himachal Pradesh",
  "guwahti (assam)": "Assam",
  "gurugram/gurgao (haryana)": "Haryana",
  "gangtok (sikkim)": "Sikkim",
  "dehradun (uk)": "Uttarakhand",
  "chennai": "Tamil Nadu",
  "bhubneshwar (odisha)": "Odisha",
  "bhopal": "Madhya Pradesh",
  "banglore": "Karnataka",
  "ahemdabad": "Gujarat",
};

export function getStateAliases(normalizedState: string): string[] {
  const aliases = [normalizedState];
  for (const [alias, target] of Object.entries(STATE_ALIASES)) {
    if (target.toLowerCase() === normalizedState.toLowerCase()) {
      aliases.push(alias);
    }
  }
  return aliases;
}