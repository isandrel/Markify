import { discourseSuite } from '../../support/discourse-suite';
import { linuxdoSpec } from '../../fixtures';

discourseSuite({ id: 'linuxdo', spec: linuxdoSpec, tags: ['linuxdo', 'forum'] });
