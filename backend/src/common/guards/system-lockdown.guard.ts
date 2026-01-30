import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { SystemHealthService } from '../../admin/system-health.service';
import { UserRole } from '@erankup/shared';

@Injectable()
export class SystemLockdownGuard implements CanActivate {
    constructor(
        @Inject(forwardRef(() => SystemHealthService))
        private systemHealthService: SystemHealthService
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const isLocked = this.systemHealthService.getLockdownStatus();
        if (!isLocked) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Admins can bypass lockdown
        if (user && user.role === UserRole.ADMIN) {
            return true;
        }

        throw new ForbiddenException('System is currently under maintenance. Please try again later.');
    }
}
