import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MessageSquare, Phone, Mail, Users, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Interaction, CreateInteractionInput, Customer, InteractionType } from '../../../server/src/schema';

export function InteractionsView() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateInteractionInput>({
    customer_id: 0,
    type: 'Call',
    date: new Date(),
    summary: ''
  });

  const loadInteractions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getInteractions.query();
      setInteractions(data);
    } catch (error) {
      console.error('Failed to load interactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await trpc.getCustomers.query();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  useEffect(() => {
    loadInteractions();
    loadCustomers();
  }, [loadInteractions, loadCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newInteraction = await trpc.createInteraction.mutate(formData);
      setInteractions((prev: Interaction[]) => [...prev, newInteraction]);
      setFormData({
        customer_id: 0,
        type: 'Call',
        date: new Date(),
        summary: ''
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create interaction:', error);
    }
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'Call':
        return <Phone className="h-4 w-4" />;
      case 'Email':
        return <Mail className="h-4 w-4" />;
      case 'Meeting':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInteractionBadgeColor = (type: InteractionType) => {
    switch (type) {
      case 'Call':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Email':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Meeting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInteractions = interactions.filter((interaction: Interaction) => {
    const customerName = getCustomerName(interaction.customer_id);
    const matchesSearch = 
      interaction.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || interaction.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const interactionStats = {
    total: interactions.length,
    calls: interactions.filter((i: Interaction) => i.type === 'Call').length,
    emails: interactions.filter((i: Interaction) => i.type === 'Email').length,
    meetings: interactions.filter((i: Interaction) => i.type === 'Meeting').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <MessageSquare className="h-8 w-8 text-orange-600" />
            <span>Interactions</span>
          </h2>
          <p className="text-gray-600 mt-2">Track all customer communications and touchpoints</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Interaction</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Interaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={formData.customer_id > 0 ? formData.customer_id.toString() : ''}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreateInteractionInput) => ({ ...prev, customer_id: parseInt(value) }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: Customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Interaction Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: InteractionType) =>
                    setFormData((prev: CreateInteractionInput) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date.toISOString().slice(0, 16)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInteractionInput) => ({ ...prev, date: new Date(e.target.value) }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateInteractionInput) => ({ ...prev, summary: e.target.value }))
                  }
                  placeholder="Enter interaction summary..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Interaction</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{interactionStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Calls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{interactionStats.calls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Emails</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{interactionStats.emails}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Meetings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{interactionStats.meetings}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search interactions by summary or customer..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Call">Calls</SelectItem>
                <SelectItem value="Email">Emails</SelectItem>
                <SelectItem value="Meeting">Meetings</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filteredInteractions.length} interactions</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredInteractions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interactions found</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first interaction to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInteractions.map((interaction: Interaction) => (
                <Card key={interaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${getInteractionBadgeColor(interaction.type)}`}>
                          {getInteractionIcon(interaction.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{getCustomerName(interaction.customer_id)}</h3>
                            <Badge variant="outline" className={getInteractionBadgeColor(interaction.type)}>
                              {interaction.type}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{interaction.date.toLocaleDateString()} at {interaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{interaction.summary}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Recorded: {interaction.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}