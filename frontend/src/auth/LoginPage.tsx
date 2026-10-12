import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useAuth } from './AuthContext';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onValid = async (values: FormValues) => {
    setError(null);
    try {
      await login(values.username, values.password);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number }; message?: string };
      if (!axiosErr.response) {
        setError(
          'Cannot reach the API. Start the backend (python manage.py runserver) and use npm run dev for the UI.',
        );
      } else if (axiosErr.response.status === 401) {
        setError('Invalid username or password');
      } else {
        setError('Login failed. Check that the API is running on the correct port.');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
        padding: '1.5rem',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }} bordered={false}>
        <Typography.Title level={3} style={{ marginTop: 0, color: '#0d9488' }}>
          HMS Platform
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Sign in to manage registration and masters.
        </Typography.Paragraph>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        {/* Native <form> + RHF: Ant Design Form onFinish does not pass values to react-hook-form */}
        <form onSubmit={handleSubmit(onValid)}>
        <Form layout="vertical" component={false}>
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="Username"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Input {...field} autoFocus autoComplete="username" />
              </Form.Item>
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="Password"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Input.Password {...field} autoComplete="current-password" />
              </Form.Item>
            )}
          />
          <Button type="primary" htmlType="submit" block size="large">
            Sign in
          </Button>
        </Form>
        </form>
      </Card>
    </div>
  );
}
