import { Issue } from "@/components/issues/IssueCard";

export interface Cluster {
  id: string;
  center: { lat: number; lng: number };
  issues: Issue[];
  radius: number; // in meters
}

function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function findIssueClusters(issues: Issue[], radius: number = 500): Cluster[] {
  const clusters: Cluster[] = [];
  const visited = new Set<string>();

  issues.forEach((issue) => {
    if (visited.has(issue.id) || !issue.coordinates || !issue.coordinates.lat || !issue.coordinates.lng) {
      return;
    }

    const currentCluster: Issue[] = [issue];
    visited.add(issue.id);

    // Simple greedy clustering: find all neighbors within radius of this issue
    // Note: This is a simplified approach. A more robust one might be DBSCAN or similar,
    // but for "issue within 500m of surrounding issues", a central point check is a good start.
    // If we want "chaining" (A is close to B, B close to C -> A,B,C cluster), that's different.
    // The requirement says "nearly 500meter in range of surrounding issues", implying a density area.
    // We will stick to: Create a cluster around a seed if neighbors exist.

    issues.forEach((neighbor) => {
      if (visited.has(neighbor.id) || !neighbor.coordinates || !neighbor.coordinates.lat || !neighbor.coordinates.lng) {
        return;
      }

      const dist = getDistanceFromLatLonInM(
        issue.coordinates.lat,
        issue.coordinates.lng,
        neighbor.coordinates.lat,
        neighbor.coordinates.lng
      );

      if (dist <= radius) {
        currentCluster.push(neighbor);
        visited.add(neighbor.id);
      }
    });

    // Only form a cluster if there are multiple issues (or per requirement, maybe even 1? 
    // Requirement: "if the issues are nearly 500meter in range of surrounding issues then a circular shape mst appear"
    // implies grouping. Let's say count > 1 for now to reduce noise, or maybe > 2.
    // User said "found a group in 500 meter range". "Group" implies >= 2.
    if (currentCluster.length >= 2) {
        // Calculate centroid
        const totalLat = currentCluster.reduce((sum, i) => sum + i.coordinates.lat, 0);
        const totalLng = currentCluster.reduce((sum, i) => sum + i.coordinates.lng, 0);
        
        clusters.push({
            id: `cluster-${issue.id}`,
            center: {
                lat: totalLat / currentCluster.length,
                lng: totalLng / currentCluster.length
            },
            issues: currentCluster,
            radius: radius
        });
    }
  });

  return clusters;
}
