'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Toolbar, Typography, Tabs, Tab } from '@mui/material';

const navItems = [
  { href: '/', label: 'Gallery' },
  { href: '/history', label: 'History' },
];

export function AppNav() {
  const pathname = usePathname();

  const tabValue = navItems.findIndex((item) => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  });

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" component="span" sx={{ mr: 2 }}>
          Mini AI Toolkit
        </Typography>
        <Tabs
          value={tabValue >= 0 ? tabValue : false}
          sx={{
            minHeight: 48,
            '& .MuiTab-root': { minHeight: 48 },
          }}
        >
          {navItems.map((item) => (
            <Tab
              key={item.href}
              label={item.label}
              component={Link}
              href={item.href}
              sx={{ textTransform: 'none' }}
            />
          ))}
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
