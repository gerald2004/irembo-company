import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const BulkSMSForm = () => {
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [scheduleType, setScheduleType] = useState('immediate');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const memberGroups = [
    { id: 'all', name: 'All Members' },
    { id: 'defaulters', name: 'Loan Defaulters' },
    { id: 'savers', name: 'Active Savers' },
    { id: 'inactive', name: 'Inactive Members' },
  ];

  const smsTemplates = [
    { id: 'payment-reminder', name: 'Payment Reminder', template: 'Dear {name}, your payment of {amount} is due on {date}.' },
    { id: 'meeting-notice', name: 'Meeting Notice', template: 'Dear {name}, SACCO meeting on {date} at {time}. Venue: {venue}' },
    { id: 'dividend-notice', name: 'Dividend Notice', template: 'Dear {name}, your dividend of {amount} has been credited to your account.' },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        setFileName(file.name);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSendSMS = async () => {
    setIsLoading(true);
    try {
      if (recipientType === 'custom' && !csvFile) {
        throw new Error('Please upload a CSV file for custom recipients');
      }

      const formData = new FormData();
      formData.append('message', message);
      formData.append('recipientType', recipientType);
      
      if (recipientType === 'groups') {
        formData.append('selectedGroups', JSON.stringify(selectedGroups));
      }
      
      if (recipientType === 'custom' && csvFile) {
        formData.append('customList', csvFile);
      }
      
      formData.append('scheduleType', scheduleType);
      if (scheduleType === 'scheduled') {
        formData.append('scheduledDate', scheduledDate.toISOString());
      }

      const response = await fetch('/api/sacco/sms/send', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: 'SMS Sent Successfully',
          description: 'Your bulk SMS has been queued for delivery.',
        });
        setMessage('');
        setRecipientType('all');
        setSelectedGroups([]);
        setCsvFile(null);
        setFileName('');
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = (template) => {
    setMessage(template);
  };

  const downloadSampleCSV = () => {
    const csvContent = `phone,name,account_number
254712345678,John Doe,ACC001
254723456789,Jane Smith,ACC002
254734567890,Robert Johnson,ACC003
254745678901,Sarah Williams,ACC004
254756789012,Michael Brown,ACC005`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_sms_contacts.csv';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Recipients</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recipient type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="groups">Specific Groups</SelectItem>
                <SelectItem value="custom">Custom List (Upload CSV)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {recipientType === 'groups' && (
            <div className="space-y-2">
              <Label>Select Groups</Label>
              {memberGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={(checked) => {
                      setSelectedGroups(
                        checked
                          ? [...selectedGroups, group.id]
                          : selectedGroups.filter((id) => id !== group.id)
                      );
                    }}
                  />
                  <Label htmlFor={group.id}>{group.name}</Label>
                </div>
              ))}
            </div>
          )}

          {recipientType === 'custom' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Upload CSV File</Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary hover:text-primary/80"
                  onClick={downloadSampleCSV}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Sample CSV
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent border-muted-foreground/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV file with phone numbers (max. 10MB)
                    </p>
                  </div>
                  <Input
                    id="csv-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>
              {fileName && (
                <div className="flex items-center mt-2 text-sm text-foreground">
                  <span className="font-medium">{fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-destructive hover:text-destructive/80"
                    onClick={() => {
                      setCsvFile(null);
                      setFileName('');
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p>CSV format: Phone numbers in the first column (e.g., &ldquo;254712345678&ldquo;)</p>
                <p>Optional columns: name, account_number (for message personalization)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Message</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
            />
            <div className="text-sm text-muted-foreground">
              {message.length}/160 characters (1 SMS = 160 chars)
            </div>
          </div>
          <div className="space-y-2">
            <Label>Templates</Label>
            <Select onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {smsTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.template}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              Available variables: {'{name}, {amount}, {date}, {time}, {balance}'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Schedule</Label>
        <RadioGroup defaultValue="immediate" className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="immediate"
              id="immediate"
              checked={scheduleType === 'immediate'}
              onClick={() => setScheduleType('immediate')}
            />
            <Label htmlFor="immediate">Send Immediately</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="scheduled"
              id="scheduled"
              checked={scheduleType === 'scheduled'}
              onClick={() => setScheduleType('scheduled')}
            />
            <Label htmlFor="scheduled">Schedule for Later</Label>
          </div>
          {scheduleType === 'scheduled' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </RadioGroup>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSendSMS} disabled={isLoading || !message || (recipientType === 'custom' && !csvFile)}>
          {isLoading ? 'Sending...' : 'Send Bulk SMS'}
        </Button>
      </div>
    </div>
  );
};

export default BulkSMSForm;