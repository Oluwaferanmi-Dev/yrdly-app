"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  trackEvent, 
  trackUserAction, 
  trackApiError, 
  createUISpan, 
  createAPISpan,
  logInfo,
  logError,
  logWarn,
  logDebugFmt
} from '@/lib/sentry';
import * as Sentry from '@sentry/nextjs';

export default function TestSentryPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testErrorCapture = () => {
    try {
      throw new Error('Test error for Sentry - this is intentional');
    } catch (error) {
      Sentry.captureException(error);
      addResult('✅ Error captured and sent to Sentry');
    }
  };

  const testCustomEvent = () => {
    trackEvent('sentry_test_event', {
      testType: 'custom_event',
      timestamp: new Date().toISOString(),
    });
    addResult('✅ Custom event sent to Sentry');
  };

  const testUserAction = () => {
    trackUserAction('sentry_test_action', {
      testType: 'user_action',
      timestamp: new Date().toISOString(),
    });
    addResult('✅ User action tracked in Sentry');
  };

  const testApiError = () => {
    const error = new Error('Test API error');
    trackApiError(error, {
      endpoint: '/test-sentry',
      method: 'POST',
      userId: 'test-user',
      requestData: { test: true },
    });
    addResult('✅ API error tracked in Sentry');
  };

  const testPerformance = () => {
    const start = performance.now();
    setTimeout(() => {
      const duration = performance.now() - start;
      Sentry.addBreadcrumb({
        message: 'Performance test completed',
        category: 'performance',
        data: { duration: Math.round(duration) },
        level: 'info',
      });
      addResult(`✅ Performance metric sent to Sentry (${Math.round(duration)}ms)`);
    }, 100);
  };

  const testUISpan = () => {
    createUISpan(
      'Test Button Click',
      'ui.click',
      (span) => {
        span.setAttribute('button_type', 'test');
        span.setAttribute('timestamp', new Date().toISOString());
        
        // Simulate some work
        setTimeout(() => {
          span.setAttribute('duration', '100ms');
          addResult('✅ UI span created and sent to Sentry');
        }, 100);
      }
    );
  };

  const testAPISpan = () => {
    createAPISpan(
      'GET /api/test',
      'http.client',
      async (span) => {
        span.setAttribute('method', 'GET');
        span.setAttribute('url', '/api/test');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
        
        span.setAttribute('status_code', 200);
        span.setAttribute('response_time', '200ms');
        addResult('✅ API span created and sent to Sentry');
      }
    );
  };

  const testStructuredLogging = () => {
    logInfo('Test info log', { 
      testType: 'structured_logging',
      timestamp: new Date().toISOString() 
    });
    addResult('✅ Structured info log sent to Sentry');
  };

  const testTemplateLogging = () => {
    const userId = 'test-user-123';
    const action = 'button_click';
    
    logDebugFmt`User ${userId} performed action: ${action}`;
    addResult('✅ Template literal log sent to Sentry');
  };

  const testErrorLogging = () => {
    logError('Test error log', {
      errorType: 'test_error',
      severity: 'medium',
      timestamp: new Date().toISOString()
    });
    addResult('✅ Error log sent to Sentry');
  };

  const testWarningLogging = () => {
    logWarn('Test warning log', {
      warningType: 'test_warning',
      context: 'sentry_test_page',
      timestamp: new Date().toISOString()
    });
    addResult('✅ Warning log sent to Sentry');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sentry Integration Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Test various Sentry features to ensure they&apos;re working correctly.
              Check your Sentry dashboard to see the captured events.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Error Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={testErrorCapture} variant="destructive">
                    Test Error Capture
                  </Button>
                  <Button onClick={testCustomEvent} variant="outline">
                    Test Custom Event
                  </Button>
                  <Button onClick={testUserAction} variant="outline">
                    Test User Action
                  </Button>
                  <Button onClick={testApiError} variant="outline">
                    Test API Error
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Performance & Tracing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={testPerformance} variant="outline">
                    Test Performance
                  </Button>
                  <Button onClick={testUISpan} variant="outline">
                    Test UI Span
                  </Button>
                  <Button onClick={testAPISpan} variant="outline">
                    Test API Span
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Structured Logging</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={testStructuredLogging} variant="outline">
                    Test Info Log
                  </Button>
                  <Button onClick={testTemplateLogging} variant="outline">
                    Test Template Log
                  </Button>
                  <Button onClick={testErrorLogging} variant="outline">
                    Test Error Log
                  </Button>
                  <Button onClick={testWarningLogging} variant="outline">
                    Test Warning Log
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={clearResults} variant="ghost" className="w-full">
                  Clear Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>NEXT_PUBLIC_SENTRY_DSN:</strong>{' '}
                {process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Set' : '❌ Not set'}
              </div>
              <div>
                <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
