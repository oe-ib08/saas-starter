'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Heart, MessageSquare, User } from 'lucide-react';

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

interface FeedMessage {
  id: number;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  category: string;
  like_count: number;
  created_at: string;
  is_liked_by_user: number;
}

const categoryColors = {
  general: 'bg-gray-100 text-gray-800',
  support: 'bg-blue-100 text-blue-800',
  'feature-request': 'bg-purple-100 text-purple-800',
  'bug-report': 'bg-red-100 text-red-800',
  feedback: 'bg-green-100 text-green-800',
  other: 'bg-yellow-100 text-yellow-800'
};

export default function FeedPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data: feedData, error, mutate } = useSWR(`/api/feed?page=${page}&limit=10`, fetcher);

  const handleLike = async (messageId: number, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        // Refresh the feed data
        mutate();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading feed. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p>Loading feed...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (feedData.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Please sign in to view the feed.</p>
            <Button onClick={() => router.push('/sign-in')} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const messages: FeedMessage[] = feedData.messages || [];
  const pagination = feedData.pagination;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Community Feed</h1>
          <p className="text-muted-foreground">See what the community is talking about</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/submit')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Submit Message
          </Button>
          <Button variant="outline" onClick={() => router.push('/messages')}>
            My Messages
          </Button>
        </div>
      </div>

      {/* Feed Messages */}
      <div className="space-y-4 mb-6">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No messages in the feed yet. Be the first to share something!</p>
              <Button className="mt-4" onClick={() => router.push('/submit')}>
                Submit Your First Message
              </Button>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{message.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={`text-xs ${categoryColors[message.category as keyof typeof categoryColors] || categoryColors.other}`}
                  >
                    {message.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <h3 className="font-semibold text-lg mb-2">{message.title}</h3>
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                  {message.content}
                </p>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(message.id, Boolean(message.is_liked_by_user))}
                    className={`flex items-center space-x-1 ${
                      message.is_liked_by_user ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart 
                      className={`w-4 h-4 ${message.is_liked_by_user ? 'fill-current' : ''}`} 
                    />
                    <span>{message.like_count}</span>
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    {message.like_count === 1 ? '1 like' : `${message.like_count} likes`}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}