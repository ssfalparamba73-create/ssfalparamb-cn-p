const fs = require('fs');
const file = 'src/lib/client/memberQueries.ts';
let content = fs.readFileSync(file, 'utf8');

// Find memberDashboardQuery and add refetchOnWindowFocus
const dashboardQueryPattern = `export const memberDashboardQuery = queryOptions({
  queryKey: memberQueryKeys.dashboard,
  queryFn: getMemberDashboard,
  staleTime: 2 * MINUTE,
});`;

const newDashboardQuery = `export const memberDashboardQuery = queryOptions({
  queryKey: memberQueryKeys.dashboard,
  queryFn: getMemberDashboard,
  staleTime: 2 * MINUTE,
  refetchOnWindowFocus: true, // explicitly opt-in for dashboard live updates
});`;

if (content.includes(dashboardQueryPattern)) {
  content = content.replace(dashboardQueryPattern, newDashboardQuery);
  fs.writeFileSync(file, content);
} else {
  console.log("Could not find the exact dashboard query pattern");
}
