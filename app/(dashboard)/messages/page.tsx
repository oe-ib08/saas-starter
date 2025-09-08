'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface Message {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  like_count: number;
  created_at: string;
  updated_at: string;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function MessagesPage() {
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'>('all');

  const { data: messagesData, error, mutate } = useSWR('/api/messages', fetcher);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading messages. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!messagesData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p>Loading messages...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (messagesData.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Please sign in to view messages.</p>
            <Button onClick={() => router.push('/sign-in')} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const messages: Message[] = messagesData.messages || [];
  const isAdmin = messagesData.isAdmin || false;
  const filteredMessages = messages.filter(message => 
    filter === 'all' ? true : message.status === filter
  );

  const handleStatusUpdate = async (messageId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          status: newStatus
        }),
      });

      if (response.ok) {
        mutate(); // Refresh the messages
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage({ ...selectedMessage, status: newStatus as any });
        }
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages?id=${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate(); // Refresh the messages
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? 'Admin: All Messages' : 'Your Messages'}
          </h1>
          {isAdmin && (
            <p className="text-sm text-muted-foreground">
              You have admin access to moderate all messages
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/submit')}>
            Submit New Message
          </Button>
          <Button variant="outline" onClick={() => router.push('/feed')}>
            View Feed
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Messages List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Messages ({filteredMessages.length})
              <div className="text-sm font-normal">
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="rounded border px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMessages.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {filter === 'all' ? 'No messages found.' : `No ${filter} messages.`}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{message.title}</h4>
                      <div className="flex items-center gap-1">
                        <Badge className={`text-xs ${priorityColors[message.priority]}`}>
                          {message.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">♥ {message.like_count}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className={`text-xs ${statusColors[message.status]}`}>
                        {message.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedMessage ? 'Message Details' : 'Select a Message'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                {/* Message Header */}
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold mb-2">{selectedMessage.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className={priorityColors[selectedMessage.priority]}>
                      {selectedMessage.priority} priority
                    </Badge>
                    <Badge className={statusColors[selectedMessage.status]}>
                      {selectedMessage.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{selectedMessage.category}</Badge>
                    <Badge variant="outline">♥ {selectedMessage.like_count} likes</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>From: {selectedMessage.user_name} ({selectedMessage.user_email})</p>
                    <p>Submitted: {new Date(selectedMessage.created_at).toLocaleString()}</p>
                    {selectedMessage.updated_at !== selectedMessage.created_at && (
                      <p>Updated: {new Date(selectedMessage.updated_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <h3 className="font-medium mb-2">Message Content</h3>
                  <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {selectedMessage.content}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <div className="flex gap-2 flex-wrap">
                    {isAdmin && (
                      <>
                        {selectedMessage.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStatusUpdate(selectedMessage.id, 'completed')}
                          >
                            Approve for Feed
                          </Button>
                        )}
                        {selectedMessage.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(selectedMessage.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        )}
                      </>
                    )}
                    {selectedMessage.status !== 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedMessage.id, 'in_progress')}
                      >
                        Mark In Progress
                      </Button>
                    )}
                    {selectedMessage.status !== 'completed' && !isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedMessage.id, 'completed')}
                      >
                        Mark Completed
                      </Button>
                    )}
                    {selectedMessage.status !== 'rejected' && !isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedMessage.id, 'rejected')}
                      >
                        Mark Rejected
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="ml-auto"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Select a message from the list to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
