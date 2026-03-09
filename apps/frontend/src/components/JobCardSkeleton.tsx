import { Card, CardContent, Skeleton, Box } from '@mui/material';

export function JobCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton
          variant="rectangular"
          sx={{ mt: 2, borderRadius: 1, aspectRatio: '1' }}
        />
        <Box sx={{ display: 'flex', gap: 0.5, mt: 2 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </CardContent>
    </Card>
  );
}
