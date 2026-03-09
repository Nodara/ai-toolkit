import { Typography, Container, Paper } from '@mui/material';
import { PromptForm } from '@/components';

export default function Home() {
  return (
    <main>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Toolkit
        </Typography>
        <Paper sx={{ p: 3 }}>
          <PromptForm />
        </Paper>
      </Container>
    </main>
  );
}
