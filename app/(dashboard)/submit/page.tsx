'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { error: 'Unauthorized' };
    }
    throw new Error('Failed to fetch');
  }
  return res.json();
};

export default function SubmitPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user's existing messages to show limits
  const { data: messagesData, mutate } = useSWR('/api/messages', fetcher);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          category,
          priority
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit message');
        return;
      }

      setSuccess(`Message submitted successfully! You have ${data.remainingSlots} slot${data.remainingSlots !== 1 ? 's' : ''} remaining.`);
      setTitle('');
      setContent('');
      setCategory('general');
      setPriority('medium');
      
      // Refresh the messages data
      mutate();

    } catch (err) {
      setError('An error occurred while submitting your message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userMessages = messagesData?.messages || [];
  const messageCount = userMessages.length;

  // Determine user's plan and limits (this would come from user data in a real app)
  const isPro = false; // You can get this from user context or API
  const messageLimit = isPro ? 3 : 1;
  const remainingSlots = messageLimit - messageCount;
  const canSubmit = remainingSlots > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Submit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit a Message</CardTitle>
            <div className="text-sm text-muted-foreground">
              {isPro ? 'Pro Plan' : 'Free Plan'} - {remainingSlots} of {messageLimit} slot{messageLimit !== 1 ? 's' : ''} remaining
            </div>
          </CardHeader>
          <CardContent>
            {!canSubmit && (
              <div className="mb-4 p-3 border border-amber-200 bg-amber-50 text-amber-800 rounded-md">
                You have reached your message limit. {isPro ? 'Pro users can submit up to 3 messages.' : 'Free users can submit 1 message. Upgrade to Pro for more slots!'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter message title"
                  maxLength={500}
                  required
                  disabled={!canSubmit}
                />
              </div>

              <div>
                <Label htmlFor="content">Message *</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your message content"
                  className="w-full min-h-[120px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  required
                  disabled={!canSubmit}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  disabled={!canSubmit}
                >
                  <option value="general">General</option>
                  <option value="support">Support</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="bug-report">Bug Report</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-6 mt-2" disabled={!canSubmit}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" disabled={!canSubmit} />
                    <Label htmlFor="low" className={!canSubmit ? 'text-muted-foreground' : ''}>Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" disabled={!canSubmit} />
                    <Label htmlFor="medium" className={!canSubmit ? 'text-muted-foreground' : ''}>Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" disabled={!canSubmit} />
                    <Label htmlFor="high" className={!canSubmit ? 'text-muted-foreground' : ''}>High</Label>
                  </div>
                </RadioGroup>
              </div>

              {error && (
                <div className="p-3 border border-red-200 bg-red-50 text-red-800 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 border border-green-200 bg-green-50 text-green-800 rounded-md">
                  {success}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !canSubmit}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Message'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/messages')}
                >
                  View Messages
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* User's Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Your Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {userMessages.length === 0 ? (
              <p className="text-muted-foreground">No messages submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {userMessages.slice(0, 3).map((message: any) => (
                  <div key={message.id} className="p-3 border rounded-md">
                    <h4 className="font-medium text-sm">{message.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.category} • {message.priority} • {message.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {userMessages.length > 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/messages')}
                    className="w-full"
                  >
                    View All Messages ({userMessages.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
